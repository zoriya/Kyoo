from datetime import timedelta
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
		# Remove seasons in "One Piece (1999) 152.mkv" for example
		if raw.get("season") == raw.get("year") and "season" in raw:
			del raw["season"]

		if isinstance(raw.get("season"), list):
			raise ProviderError(
				f"An episode can't have multiple seasons (found {raw.get('season')} for {path})"
			)
		if isinstance(raw.get("episode"), list):
			raise ProviderError(
				f"Multi-episodes files are not yet supported (for {path})"
			)

		logger.info("Identied %s: %s", path, raw)

		if raw["type"] == "movie":
			movie = await self._provider.search_movie(raw["title"], raw.get("year"))
			movie.path = str(path)
			logger.debug("Got movie: %s", movie)
			movie_id = await self._client.post("movies", data=movie.to_kyoo())

			if any(movie.collections):
				ids = await asyncio.gather(
					*(self.create_or_get_collection(x) for x in movie.collections)
				)
				await asyncio.gather(
					*(self._client.link_collection(x, "movie", movie_id) for x in ids)
				)
		elif raw["type"] == "episode":
			episode = await self._provider.search_episode(
				raw["title"],
				season=raw.get("season"),
				episode_nbr=raw.get("episode"),
				absolute=raw.get("episode") if "season" not in raw else None,
				year=raw.get("year"),
			)
			episode.path = str(path)
			logger.debug("Got episode: %s", episode)
			episode.show_id = await self.create_or_get_show(episode)

			if episode.season_number is not None:
				episode.season_id = await self.register_seasons(
					episode.show, episode.show_id, episode.season_number
				)
			await self._client.post("episodes", data=episode.to_kyoo())
		else:
			logger.warn("Unknown video file type: %s", raw["type"])

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

	async def create_or_get_show(self, episode: Episode) -> str:
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
