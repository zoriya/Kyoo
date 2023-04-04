import os
import asyncio
import logging
import jsons
from aiohttp import ClientSession
from pathlib import Path
from guessit import guessit
from providers.provider import Provider
from providers.types.episode import Episode, PartialShow
from providers.types.season import Season, SeasonTranslation
from .utils import batch, log_errors, provider_cache, set_in_cache


class Scanner:
	def __init__(
		self, client: ClientSession, *, languages: list[str], api_key: str
	) -> None:
		self._client = client
		self._api_key = api_key
		self._url = os.environ.get("KYOO_URL", "http://back:5000")
		self.provider = Provider.get_all(client)[0]
		self.cache = {"shows": {}, "seasons": {}}
		self.languages = languages

	async def scan(self, path: str):
		logging.info("Starting the scan. It can take some times...")
		videos = filter(lambda p: p.is_file(), Path(path).rglob("*"))
		# We batch videos by 30 because too mutch at once kinda DDOS everything.
		for group in batch(videos, 30):
			await asyncio.gather(*map(self.identify, group))

	async def is_registered(self, path: Path) -> bool:
		# TODO: Once movies are separated from the api, a new endpoint should be created to check for paths.
		async with self._client.get(
			f"{self._url}/episodes/count",
			params={"path": str(path)},
			headers={"X-API-Key": self._api_key},
		) as r:
			r.raise_for_status()
			ret = await r.text()
			if ret != "0":
				return True
		return False

	@log_errors
	async def identify(self, path: Path):
		raw = guessit(path, "--episode-prefer-number")

		if (
			not "mimetype" in raw
			or not raw["mimetype"].startswith("video")
			or await self.is_registered(path)
		):
			return

		logging.info("Identied %s: %s", path, raw)

		# TODO: Add collections support
		if raw["type"] == "movie":
			movie = await self.provider.identify_movie(
				raw["title"], raw.get("year"), language=self.languages
			)
			movie.path = str(path)
			logging.debug("Got movie: %s", movie)
			await self.post("movies", data=movie.to_kyoo())
		elif raw["type"] == "episode":
			episode = await self.provider.identify_episode(
				raw["title"],
				season=raw.get("season"),
				episode_nbr=raw.get("episode"),
				absolute=raw.get("episode") if "season" not in raw else None,
				language=self.languages,
			)
			episode.path = str(path)
			logging.debug("Got episode: %s", episode)
			episode.show_id = await self.create_or_get_show(episode)

			if episode.season_number is not None:
				await self.register_seasons(
					show_id=episode.show_id,
					season_number=episode.season_number,
				)
			await self.post("episodes", data=episode.to_kyoo())
		else:
			logging.warn("Unknown video file type: %s", raw["type"])

	async def create_or_get_show(self, episode: Episode) -> str:
		@provider_cache("shows")
		async def create_show(_: str):
			# TODO: Check if a show with the same metadata id exists already on kyoo.
			show = (
				await self.provider.identify_show(episode.show, language=self.languages)
				if isinstance(episode.show, PartialShow)
				else episode.show
			)
			logging.debug("Got show: %s", episode)
			ret = await self.post("show", data=show.to_kyoo())
			try:
				for season in show.seasons:
					season.show_id = ret
					await self.post("seasons", data=season.to_kyoo())
					set_in_cache(key=["seasons", ret, season.season_number])
			except Exception as e:
				logging.exception("Unhandled error create a season", exc_info=e)
			return ret

		# The parameter is only used as a key for the cache.
		provider_id = episode.show.external_ids[self.provider.name].id
		return await create_show(provider_id)

	@provider_cache("seasons")
	async def register_seasons(self, show_id: str, season_number: int):
		# TODO: fetch season here. this will be useful when a new season of a show is aired after the show has been created on kyoo.
		season = Season(
			season_number=season_number,
			show_id=show_id,
			translations={lng: SeasonTranslation() for lng in self.languages},
		)
		await self.post("seasons", data=season.to_kyoo())

	async def post(self, path: str, *, data: object) -> str:
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
			return ret["id"]
