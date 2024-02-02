from datetime import timedelta
import os
import asyncio
import logging
import jsons
import re
from aiohttp import ClientSession
from pathlib import Path
from typing import List, Literal, Any
from providers.provider import Provider
from providers.types.collection import Collection
from providers.types.show import Show
from providers.types.episode import Episode, PartialShow
from providers.types.season import Season
from .parser.guess import guessit
from .utils import batch, log_errors
from .cache import cache, exec_as_cache, make_key


class Scanner:
	def __init__(
		self, client: ClientSession, *, languages: list[str], api_key: str
	) -> None:
		self._client = client
		self._api_key = api_key
		self._url = os.environ.get("KYOO_URL", "http://back:5000")
		try:
			self._ignore_pattern = re.compile(
				os.environ.get("LIBRARY_IGNORE_PATTERN", "")
			)
		except Exception as e:
			self._ignore_pattern = re.compile("")
			logging.error(f"Invalid ignore pattern. Ignoring. Error: {e}")
		self.provider = Provider.get_all(client, languages)[0]
		self.languages = languages

		self._collection_cache = {}
		self._show_cache = {}
		self._season_cache = {}

	async def scan(self, path: str):
		logging.info("Starting the scan. It can take some times...")
		self.registered = await self.get_registered_paths()
		videos = [str(p) for p in Path(path).rglob("*") if p.is_file()]
		deleted = [x for x in self.registered if x not in videos]

		if len(deleted) != len(self.registered):
			for x in deleted:
				await self.delete(x)
		elif len(deleted) > 0:
			logging.warning("All video files are unavailable. Check your disks.")

		# We batch videos by 20 because too mutch at once kinda DDOS everything.
		for group in batch(iter(videos), 20):
			await asyncio.gather(*map(self.identify, group))

	async def get_registered_paths(self) -> List[str]:
		paths = None
		async with self._client.get(
			f"{self._url}/episodes",
			params={"limit": 0},
			headers={"X-API-Key": self._api_key},
		) as r:
			r.raise_for_status()
			ret = await r.json()
			paths = list(x["path"] for x in ret["items"])

		async with self._client.get(
			f"{self._url}/movies",
			params={"limit": 0},
			headers={"X-API-Key": self._api_key},
		) as r:
			r.raise_for_status()
			ret = await r.json()
			paths += list(x["path"] for x in ret["items"])
		return paths

	@log_errors
	async def identify(self, path: str):
		if path in self.registered or self._ignore_pattern.match(path):
			return

		raw = guessit(path)

		if "mimetype" not in raw or not raw["mimetype"].startswith("video"):
			return
		# Remove seasons in "One Piece (1999) 152.mkv" for example
		if raw.get("season") == raw.get("year") and "season" in raw:
			del raw["season"]

		logging.info("Identied %s: %s", path, raw)

		if raw["type"] == "movie":
			movie = await self.provider.identify_movie(raw["title"], raw.get("year"))
			movie.path = str(path)
			logging.debug("Got movie: %s", movie)
			movie_id = await self.post("movies", data=movie.to_kyoo())

			if any(movie.collections):
				ids = await asyncio.gather(
					*(self.create_or_get_collection(x) for x in movie.collections)
				)
				await asyncio.gather(
					*(self.link_collection(x, "movie", movie_id) for x in ids)
				)
		elif raw["type"] == "episode":
			episode = await self.provider.identify_episode(
				raw["title"],
				season=raw.get("season"),
				episode_nbr=raw.get("episode"),
				absolute=raw.get("episode") if "season" not in raw else None,
				year=raw.get("year"),
			)
			episode.path = str(path)
			logging.debug("Got episode: %s", episode)
			episode.show_id = await self.create_or_get_show(episode)

			if episode.season_number is not None:
				episode.season_id = await self.register_seasons(
					episode.show, episode.show_id, episode.season_number
				)
			await self.post("episodes", data=episode.to_kyoo())
		else:
			logging.warn("Unknown video file type: %s", raw["type"])

	async def create_or_get_collection(self, collection: Collection) -> str:
		@cache(ttl=timedelta(days=1), cache=self._collection_cache)
		async def create_collection(provider_id: str):
			# TODO: Check if a collection with the same metadata id exists already on kyoo.
			new_collection = (
				await self.provider.identify_collection(provider_id)
				if not any(collection.translations.keys())
				else collection
			)
			logging.debug("Got collection: %s", new_collection)
			return await self.post("collection", data=new_collection.to_kyoo())

		# The parameter is only used as a key for the cache.
		provider_id = collection.external_id[self.provider.name].data_id
		return await create_collection(provider_id)

	async def link_collection(
		self, collection: str, type: Literal["movie"] | Literal["show"], id: str
	):
		async with self._client.put(
			f"{self._url}/collections/{collection}/{type}/{id}",
			headers={"X-API-Key": self._api_key},
		) as r:
			# Allow 409 and continue as if it worked.
			if not r.ok and r.status != 409:
				logging.error(f"Request error: {await r.text()}")
				r.raise_for_status()

	async def create_or_get_show(self, episode: Episode) -> str:
		@cache(ttl=timedelta(days=1), cache=self._show_cache)
		async def create_show(_: str):
			# TODO: Check if a show with the same metadata id exists already on kyoo.
			show = (
				await self.provider.identify_show(
					episode.show.external_id[self.provider.name].data_id,
				)
				if isinstance(episode.show, PartialShow)
				else episode.show
			)
			# TODO: collections
			logging.debug("Got show: %s", episode)
			ret = await self.post("show", data=show.to_kyoo())

			async def create_season(season: Season, id: str):
				try:
					season.show_id = id
					return await self.post("seasons", data=season.to_kyoo())
				except Exception as e:
					logging.exception("Unhandled error create a season", exc_info=e)

			season_tasks = map(
				lambda s: exec_as_cache(
					self._season_cache,
					make_key((ret, s.season_number)),
					lambda: create_season(s, ret),
				),
				show.seasons,
			)
			await asyncio.gather(*season_tasks)

			return ret

		# The parameter is only used as a key for the cache.
		provider_id = episode.show.external_id[self.provider.name].data_id
		return await create_show(provider_id)

	async def register_seasons(
		self, show: Show | PartialShow, show_id: str, season_number: int
	) -> str:
		# We use an external season cache because we want to edit this cache programatically
		@cache(ttl=timedelta(days=1), cache=self._season_cache)
		async def create_season(_: str, __: int):
			season = await self.provider.identify_season(
				show.external_id[self.provider.name].data_id, season_number
			)
			season.show_id = show_id
			return await self.post("seasons", data=season.to_kyoo())

		return await create_season(show_id, season_number)

	async def post(self, path: str, *, data: dict[str, Any]) -> str:
		logging.debug(
			"Sending %s: %s",
			path,
			jsons.dumps(
				data,
				key_transformer=jsons.KEY_TRANSFORMER_CAMELCASE,
				jdkwargs={"indent": 4},
			),
		)
		async with self._client.post(
			f"{self._url}/{path}",
			json=data,
			headers={"X-API-Key": self._api_key},
		) as r:
			# Allow 409 and continue as if it worked.
			if not r.ok and r.status != 409:
				logging.error(f"Request error: {await r.text()}")
				r.raise_for_status()
			ret = await r.json()

			if r.status == 409 and (
				(path == "shows" and ret["startAir"][:4] != str(data["start_air"].year))
				or (
					path == "movies"
					and ret["airDate"][:4] != str(data["air_date"].year)
				)
			):
				logging.info(
					f"Found a {path} with the same slug ({ret['slug']}) and a different date, using the date as part of the slug"
				)
				year = (data["start_air"] if path == "movie" else data["air_date"]).year
				data["slug"] = f"{ret['slug']}-{year}"
				return await self.post(path, data=data)
			return ret["id"]

	async def delete(self, path: str):
		logging.info("Deleting %s", path)
		self.registered = filter(lambda x: x != path, self.registered)
		async with self._client.delete(
			f'{self._url}/movies?filter=path eq "{path}"',
			headers={"X-API-Key": self._api_key},
		) as r:
			if not r.ok:
				logging.error(f"Request error: {await r.text()}")
				r.raise_for_status()

		async with self._client.delete(
			f'{self._url}/episodes?filter=path eq "{path}"',
			headers={"X-API-Key": self._api_key},
		) as r:
			if not r.ok:
				logging.error(f"Request error: {await r.text()}")
				r.raise_for_status()
