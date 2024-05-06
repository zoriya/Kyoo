from datetime import timedelta
from aiohttp import ClientSession
from logging import getLogger
from typing import Optional, Any

from matcher.cache import cache

from ..provider import Provider, ProviderError
from ..types.movie import Movie, MovieTranslation, Status as MovieStatus
from ..types.season import Season, SeasonTranslation
from ..types.episode import Episode, EpisodeTranslation, PartialShow, EpisodeID
from ..types.studio import Studio
from ..types.genre import Genre
from ..types.metadataid import MetadataID
from ..types.show import Show, ShowTranslation, Status as ShowStatus
from ..types.collection import Collection, CollectionTranslation

logger = getLogger(__name__)


class TVDB(Provider):
	def __init__(
		self,
		client: ClientSession,
		api_key: str,
		pin: str,
		languages: list[str],
	) -> None:
		super().__init__()
		self._client = client
		self.base = "https://api4.thetvdb.com/v4/"
		self._api_key = api_key
		self._pin = pin
		self._languages = languages

	@cache(ttl=timedelta(days=30))
	async def login(self) -> str:
		async with self._client.post(
			f"{self.base}/login",
			json={"apikey": self._api_key, "pin": self._pin},
		) as r:
			r.raise_for_status()
			ret = await r.json()
			return ret["data"]["token"]

	async def get(
		self,
		path: str,
		*,
		params: dict[str, Any] = {},
		not_found_fail: Optional[str] = None,
	):
		token = await self.login()
		params = {k: v for k, v in params.items() if v is not None}
		async with self._client.get(
			f"{self.base}/{path}",
			params={"api_key": self._api_key, **params},
			headers={"Authorization": f"Bearer {token}"},
		) as r:
			if not_found_fail and r.status == 404:
				raise ProviderError(not_found_fail)
			r.raise_for_status()
			return await r.json()

	@property
	def name(self) -> str:
		return "tvdb"

	async def search_episode(
		self,
		name: str,
		season: Optional[int],
		episode_nbr: Optional[int],
		absolute: Optional[int],
		year: Optional[int],
	) -> Episode:
		show = await self.search_show(name, year)
		show_id = show.external_id[self.name].data_id
		return await self.identify_episode(show_id, season, episode_nbr, absolute)

	async def identify_episode(
		self,
		show_id: str,
		season: Optional[int],
		episode_nbr: Optional[int],
		absolute: Optional[int],
	) -> Episode:
		return await self.get(f"")
