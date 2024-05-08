import asyncio
from datetime import timedelta, datetime
from aiohttp import ClientSession
from logging import getLogger
from typing import Optional, Any, Literal

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

	def two_to_three_lang(self, lang: str) -> str:
		return lang

	def three_to_two_lang(self, lang: str) -> str:
		return lang

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
		path: Optional[str] = None,
		*,
		fullPath: Optional[str] = None,
		params: dict[str, Any] = {},
		not_found_fail: Optional[str] = None,
	):
		token = await self.login()
		params = {k: v for k, v in params.items() if v is not None}
		async with self._client.get(
			fullPath or f"{self.base}/{path}",
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

	async def search_show(self, name: str, year: Optional[int]) -> Show:
		pass

	@cache(ttl=timedelta(days=1))
	async def get_episodes(
		self,
		show_id: str,
		order: Literal["default", "absolute"],
		language: Optional[str] = None,
	):
		path = f"/series/{show_id}/episodes/{order}"
		if language is not None:
			path += f"/{language}"
		ret = await self.get(
			path, not_found_fail=f"Could not find show with id {show_id}"
		)
		episodes = ret["data"]["episodes"]
		next = ret["links"]["next"]
		while next != None:
			ret = await self.get(fullPath=next)
			next = ret["links"]["next"]
			episodes += ret["data"]
		return episodes

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
		flang, slang, *olang = [*self._languages, None]
		episodes = await self.get_episodes(show_id, order="default", language=flang)
		show = episodes["data"]
		ret = next(
			filter(
				(lambda x: x["seasonNumber"] == 1 and x["number"] == absolute)
				if absolute is not None
				else (
					lambda x: x["seasonNumber"] == season and x["number"] == episode_nbr
				),
				episodes["episodes"],
			),
			None,
		)
		if ret == None:
			raise ProviderError(
				f"Could not retrive episode {show['name']} s{season}e{episode_nbr}, absolute {absolute}"
			)
		absolutes = await self.get_episodes(
			show_id, order="absolute", language=slang or flang
		)
		abs = next(filter(lambda x: x["id"] == ret["id"], absolutes["episodes"]))

		otrans = await asyncio.gather(
			*(
				self.get_episodes(show_id, order="default", language=lang)
				for lang in olang
				if lang is not None
			)
		)
		translations = {
			lang: EpisodeTranslation(
				name=val["name"],
				overview=val["overview"],
			)
			for (lang, val) in zip(
				self._languages,
				[
					ret,
					abs,
					*(
						next(x for x in e["episodes"] if x["id"] == ret["id"])
						for e in otrans
					),
				],
			)
		}

		return Episode(
			show=PartialShow(
				name=show["name"],
				original_language=self.three_to_two_lang(show["originalLanguage"]),
				external_id={
					self.name: MetadataID(
						show_id, f"https://thetvdb.com/series/{show['slug']}"
					),
				},
			),
			season_number=ret["seasonNumber"],
			episode_number=ret["number"],
			absolute_number=abs["number"],
			runtime=ret["runtime"],
			release_date=datetime.strptime(ret["aired"], "%Y-%m-%d").date(),
			thumbnail=f"https://artworks.thetvdb.com{ret['image']}",
			external_id={
				self.name: EpisodeID(
					show_id,
					ret["seasonNumber"],
					ret["number"],
					f"https://thetvdb.com/series/{show_id}/episodes/{ret['id']}",
				),
			},
			translations=translations,
		)
