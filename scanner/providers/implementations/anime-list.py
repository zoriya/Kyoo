from datetime import timedelta
from logging import getLogger
from aiohttp import ClientSession
from typing import Optional, Literal
import xmltodict

from providers.implementations.thetvdb import TVDB

from ..provider import Provider
from ..utils import ProviderError
from ..types.collection import Collection
from ..types.movie import Movie
from ..types.show import Show
from ..types.season import Season
from ..types.episode import Episode
from matcher.cache import cache

logger = getLogger(__name__)


class AnimeList(Provider):
	def __init__(self, client: ClientSession, tvdb: TVDB, tmdb: Provider) -> None:
		self._client = client
		self._tvdb = tvdb
		self._tmdb = tmdb

	@cache(ttl=timedelta(days=1))
	async def _get_map(self):
		logger.info("Fetching anime-list from github")
		async with self._client.get(
			"https://raw.githubusercontent.com/Anime-Lists/anime-lists/master/anime-list.xml"
		) as r:
			r.raise_for_status()
			ret = xmltodict.parse(await r.text())
			return ret

	@cache(ttl=timedelta(days=1))
	async def _get_titles(self):
		logger.info("Fetching anime-titles from github")
		async with self._client.get(
			"https://raw.githubusercontent.com/Anime-Lists/anime-lists/master/animetitles.xml"
		) as r:
			r.raise_for_status()
			ret = xmltodict.parse(await r.text())
			return [
				{"id": x["@aid"], "titles": [t["#text"] for t in x["title"]]}
				for x in ret["animetitles"]["anime"]
			]

	@cache(ttl=timedelta(days=1))
	async def _get_info_for_id(self, aid: str):
		info = await self._get_map()
		return next(
			(x for x in info["anime-list"]["anime"] if x["@anidbid"] == aid), None
		)

	async def _get_info(
		self, name: str, year: Optional[int], kind: Literal["serie", "movie"]
	):
		aid = "1"
		return await self._get_info_for_id(aid)

	def get_episode_info(
		self, serie: dict, absolute: int
	) -> tuple[Optional[int], Optional[int], Optional[int]]:
		default_season = serie.get("@defaulttvdbseason", "")
		offset = int(serie.get("@episodeoffset", "0"))

		if default_season == "a":
			# "a" means "use tvdb default absolute ordering"
			return (None, None, absolute + offset)

		# let tvdb retrive the absolute number since we already got the right season/episode
		return (default_season, absolute + offset, None)

	async def search_episode(
		self,
		name: str,
		season: Optional[int],
		episode_nbr: Optional[int],
		absolute: Optional[int],
		year: Optional[int],
	) -> Episode:
		if absolute is not None:
			serie = await self._get_info(name, year, kind="serie")
			if serie:
				(season, episode_nbr, absolute) = self.get_episode_info(serie, absolute)
				ret = await self._tvdb.identify_episode(
					serie.tvdbid,
					season,
					episode_nbr,
					absolute,
				)
				# TODO: Add anidb id in ret.external_id
				return ret
		return await self._tmdb.search_episode(
			name, season, episode_nbr, absolute, year
		)
