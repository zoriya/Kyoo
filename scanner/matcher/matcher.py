from datetime import timedelta
from typing import Literal, Optional
import asyncio
from logging import getLogger
from providers.provider import Provider, ProviderError
from providers.types.collection import Collection
from providers.types.show import Show
from providers.types.episode import Episode, PartialShow
from providers.types.season import Season
from providers.kyoo_client import KyooClient
from .parser.guess import guessit
from .cache import cache, exec_as_cache, make_key

logger = getLogger(__name__)


class Matcher:
	def __init__(self, client: KyooClient, provider: Provider) -> None:
		self._client = client
		self._provider = provider

		self._collection_cache = {}
		self._show_cache = {}
		self._season_cache = {}

	async def delete(self, path: str):
		try:
			await self._client.delete(path)
			return True
		except Exception as e:
			logger.exception("Unhandled error", exc_info=e)
			return False

	async def identify(self, path: str):
		try:
			await self._identify(path)
			await self._client.delete_issue(path)
		except ProviderError as e:
			logger.error(e)
			await self._client.create_issue(path, str(e))
		except Exception as e:
			logger.exception("Unhandled error", exc_info=e)
			await self._client.create_issue(
				path, "Unknown error", {"type": type(e).__name__, "message": str(e)}
			)
			return False
		return True

	async def _identify(self, path: str):
		raw = guessit(path, xem_titles=await self._provider.get_expected_titles())

		if "mimetype" not in raw or not raw["mimetype"].startswith("video"):
			return

		logger.info("Identied %s: %s", path, raw)

		title = raw.get("title")
		if not isinstance(title, str):
			raise ProviderError(f"Could not guess title, found: {title}")

		year = raw.get("year")
		if year is not None and not isinstance(year, int):
			year = None
			logger.warn(f"Invalid year value. Found {year}. Ignoring")

		if raw["type"] == "movie":
			await self.search_movie(title, year, path)
		elif raw["type"] == "episode":
			season = raw.get("season")
			if isinstance(season, list):
				raise ProviderError(
					f"An episode can't have multiple seasons (found {raw.get('season')} for {path})"
				)
			if season is not None and not isinstance(season, int):
				raise ProviderError(f"Could not guess season, found: {season}")
			episode = raw.get("episode")
			if isinstance(episode, list):
				raise ProviderError(
					f"Multi-episodes files are not yet supported (for {path})"
				)
			if not isinstance(episode, int):
				raise ProviderError(f"Could not guess episode, found: {episode}")

			await self.search_episode(title, year, season, episode, path)
		else:
			logger.warn("Unknown video file type: %s", raw["type"])

	async def search_movie(self, title: str, year: Optional[int], path: str):
		movie = await self._provider.search_movie(title, year)
		movie.file_title = title
		movie.path = path
		logger.debug("Got movie: %s", movie)
		movie_id = await self._client.post("movies", data=movie.to_kyoo())

		if any(movie.collections):
			ids = await asyncio.gather(
				*(self.create_or_get_collection(x) for x in movie.collections)
			)
			await asyncio.gather(
				*(self._client.link_collection(x, "movie", movie_id) for x in ids)
			)

	async def search_episode(
		self,
		title: str,
		year: Optional[int],
		season: Optional[int],
		episode_nbr: int,
		path: str,
	):
		episode = await self._provider.search_episode(
			title,
			season=season,
			episode_nbr=episode_nbr if season is not None else None,
			absolute=episode_nbr if season is None else None,
			year=year,
		)
		episode.path = path
		logger.debug("Got episode: %s", episode)
		episode.show_id = await self.create_or_get_show(episode, title)

		if episode.season_number is not None:
			episode.season_id = await self.register_seasons(
				episode.show, episode.show_id, episode.season_number
			)
		await self._client.post("episodes", data=episode.to_kyoo())

	async def create_or_get_collection(self, collection: Collection) -> str:
		@cache(ttl=timedelta(days=1), cache=self._collection_cache)
		async def create_collection(provider_id: str):
			# TODO: Check if a collection with the same metadata id exists already on kyoo.
			new_collection = (
				await self._provider.identify_collection(provider_id)
				if not any(collection.translations.keys())
				else collection
			)
			logger.debug("Got collection: %s", new_collection)
			return await self._client.post("collection", data=new_collection.to_kyoo())

		# The parameter is only used as a key for the cache.
		provider_id = collection.external_id[self._provider.name].data_id
		return await create_collection(provider_id)

	async def create_or_get_show(self, episode: Episode, fallback_name: str) -> str:
		@cache(ttl=timedelta(days=1), cache=self._show_cache)
		async def create_show(_: str):
			# TODO: Check if a show with the same metadata id exists already on kyoo.
			show = (
				await self._provider.identify_show(
					episode.show.external_id[self._provider.name].data_id,
				)
				if isinstance(episode.show, PartialShow)
				else episode.show
			)
			show.file_title = fallback_name
			# TODO: collections
			logger.debug("Got show: %s", episode)
			ret = await self._client.post("show", data=show.to_kyoo())

			async def create_season(season: Season, id: str):
				try:
					season.show_id = id
					return await self._client.post("seasons", data=season.to_kyoo())
				except Exception as e:
					logger.exception("Unhandled error create a season", exc_info=e)

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
		provider_id = episode.show.external_id[self._provider.name].data_id
		return await create_show(provider_id)

	async def register_seasons(
		self, show: Show | PartialShow, show_id: str, season_number: int
	) -> str:
		# We use an external season cache because we want to edit this cache programatically
		@cache(ttl=timedelta(days=1), cache=self._season_cache)
		async def create_season(_: str, __: int):
			season = await self._provider.identify_season(
				show.external_id[self._provider.name].data_id, season_number
			)
			season.show_id = show_id
			return await self._client.post("seasons", data=season.to_kyoo())

		return await create_season(show_id, season_number)

	async def refresh(
		self,
		kind: Literal["collection", "movie", "episode", "show", "season"],
		kyoo_id: str,
	):
		async def id_movie(movie: dict, id: dict):
			ret = await self._provider.identify_movie(id["dataId"])
			ret.path = movie["path"]
			return ret

		async def id_season(season: dict, id: dict):
			ret = await self._provider.identify_season(
				id["dataId"], season["seasonNumber"]
			)
			ret.show_id = season["showId"]
			return ret

		async def id_episode(episode: dict, id: dict):
			ret = await self._provider.identify_episode(
				id["showId"], id["season"], id["episode"], episode["absoluteNumber"]
			)
			ret.show_id = episode["showId"]
			ret.season_id = episode["seasonId"]
			ret.path = episode["path"]
			return ret

		identify_table = {
			"collection": lambda _, id: self._provider.identify_collection(
				id["dataId"]
			),
			"movie": id_movie,
			"show": lambda _, id: self._provider.identify_show(id["dataId"]),
			"season": id_season,
			"episode": id_episode,
		}

		current = await self._client.get(f"{kind}/{kyoo_id}")
		if self._provider.name not in current["externalId"]:
			logger.error(
				f"Could not refresh metadata of {kind}/{kyoo_id}. Missing provider id."
			)
			return False
		provider_id = current["externalId"][self._provider.name]
		new_value = await identify_table[kind](current, provider_id)
		await self._client.put(f"{kind}/{kyoo_id}", data=new_value.to_kyoo())
		return True
