import asyncio
from datetime import timedelta, datetime
from urllib.parse import urlencode
from aiohttp import ClientSession
from logging import getLogger
from typing import Optional, Any, Callable, OrderedDict
from langcodes import Language

from matcher.cache import cache

from ..provider import Provider, ProviderError
from ..utils import normalize_lang
from ..types.season import Season, SeasonTranslation
from ..types.episode import Episode, EpisodeTranslation, PartialShow, EpisodeID
from ..types.studio import Studio
from ..types.genre import Genre
from ..types.metadataid import MetadataID
from ..types.show import Show, ShowTranslation, Status as ShowStatus

logger = getLogger(__name__)


class TVDB(Provider):
	DEFAULT_API_KEY = "3732560f-08b7-41db-9d9a-2966b4d90c10"

	def __init__(
		self,
		client: ClientSession,
		api_key: str,
		pin: Optional[str],
		languages: list[str],
	) -> None:
		super().__init__()
		self._client = client
		self.base = "https://api4.thetvdb.com/v4"
		self._api_key = api_key
		self._pin = pin
		# tvdb use three letter codes for languages
		# (with the terminology code as in 'fra' and not the biblographic code as in 'fre')
		self._languages = [Language.get(lang).to_alpha3() for lang in languages]
		self._genre_map = {
			"soap": Genre.SOAP,
			"science-fiction": Genre.SCIENCE_FICTION,
			"reality": Genre.REALITY,
			"news": Genre.NEWS,
			"mini-series": None,
			"horror": Genre.HORROR,
			"home-and-garden": None,
			"game-show": None,
			"food": None,
			"fantasy": Genre.FANTASY,
			"family": Genre.FAMILY,
			"drama": Genre.DRAMA,
			"documentary": Genre.DOCUMENTARY,
			"crime": Genre.CRIME,
			"comedy": Genre.COMEDY,
			"children": Genre.KIDS,
			"animation": Genre.ANIMATION,
			"adventure": Genre.ADVENTURE,
			"action": Genre.ACTION,
			"sport": None,
			"suspense": None,
			"talk-show": Genre.TALK,
			"thriller": Genre.THRILLER,
			"travel": None,
			"western": Genre.WESTERN,
			"anime": Genre.ANIMATION,
			"romance": Genre.ROMANCE,
			"musical": Genre.MUSIC,
			"podcast": None,
			"mystery": Genre.MYSTERY,
			"indie": None,
			"history": Genre.HISTORY,
			"war": Genre.WAR,
			"martial-arts": None,
			"awards-show": None,
		}

	@cache(ttl=timedelta(days=30))
	async def login(self) -> str:
		async with self._client.post(
			f"{self.base}/login",
			json={
				"apikey": self._api_key,
			}
			| ({"pin": self._pin} if self._pin else {}),
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

	@cache(ttl=timedelta(days=1))
	async def search_show(self, name: str, year: Optional[int]) -> str:
		query = OrderedDict(
			query=name,
			year=year,
			type="series",
		)
		ret = await self.get(f"search?{urlencode(query)}")
		if not any(ret["data"]):
			raise ProviderError(
				f"No serie found with the name {name} in the year {year} (on tvdb)"
			)
		return ret["data"][0]["tvdb_id"]

	async def search_episode(
		self,
		name: str,
		season: Optional[int],
		episode_nbr: Optional[int],
		absolute: Optional[int],
		year: Optional[int],
	) -> Episode:
		show_id = await self.search_show(name, year)
		return await self.identify_episode(show_id, season, episode_nbr, absolute)

	@cache(ttl=timedelta(days=1))
	async def get_episodes(
		self,
		show_id: str,
		language: Optional[str] = None,
	):
		try:
			path = f"series/{show_id}/episodes/default"
			if language is not None:
				path += f"/{language}"
			ret = await self.get(
				path,
				not_found_fail=f"Could not find show with id {show_id}",
			)
			episodes = ret["data"]["episodes"]
			next = ret["links"]["next"]
			while next != None:
				ret = await self.get(fullPath=next)
				next = ret["links"]["next"]
				episodes += ret["data"]["episodes"]
			return episodes, ret["data"]
		except ProviderError:
			return None

	@cache(ttl=timedelta(days=1))
	async def identify_episode(
		self,
		show_id: str,
		season: Optional[int],
		episode_nbr: Optional[int],
		absolute: Optional[int],
	) -> Episode:
		translations = await asyncio.gather(
			*(self.get_episodes(show_id, language=lang) for lang in self._languages)
		)
		episodes, show = next((x for x in translations if x is not None), (None, None))
		if episodes is None or show is None:
			raise ProviderError(f"Could not get episodes for show with id {show_id}")

		ret = next(
			filter(
				(lambda x: x["seasonNumber"] == 1 and x["number"] == absolute)
				if absolute is not None
				else (
					lambda x: x["seasonNumber"] == season and x["number"] == episode_nbr
				),
				episodes,
			),
			None,
		)
		if ret == None:
			raise ProviderError(
				f"Could not retrive episode {show['name']} s{season}e{episode_nbr}, absolute {absolute}"
			)

		trans = [
			(
				next((ep for ep in el[0] if ep["id"] == ret["id"]), None)
				if el is not None
				else None
			)
			for el in translations
		]

		ep_trans = {
			normalize_lang(lang): EpisodeTranslation(
				name=val["name"],
				overview=val["overview"],
			)
			for lang, val in zip(self._languages, trans)
			if val is not None
		}

		return Episode(
			show=PartialShow(
				name=show["name"],
				original_language=normalize_lang(show["originalLanguage"]),
				external_id={
					self.name: MetadataID(
						show_id, f"https://thetvdb.com/series/{show['slug']}"
					),
				},
			),
			season_number=ret["seasonNumber"],
			episode_number=ret["number"],
			absolute_number=ret["absoluteNumber"],
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
			translations=ep_trans,
		)

	@cache(ttl=timedelta(days=1))
	async def identify_show(self, show_id: str) -> Show:
		ret = await self.get(
			f"series/{show_id}/extended",
			not_found_fail=f"Could not find show with id {show_id}",
		)
		logger.debug("TVDB responded: %s", ret)

		async def process_translation(lang: str) -> Optional[ShowTranslation]:
			data = (
				await self.get(f"series/{show_id}/translations/{lang}")
				if lang is not ret["data"]["originalLanguage"]
				else ret
			)
			return ShowTranslation(
				name=data["data"]["name"],
				tagline=None,
				tags=[],
				overview=data["data"]["overview"],
				posters=[
					i["image"]
					for i in ret["data"]["artworks"]
					if i["type"] == 2
					and (i["language"] == lang or i["language"] is None)
				],
				logos=[
					i["image"]
					for i in ret["data"]["artworks"]
					if i["type"] == 5
					and (i["language"] == lang or i["language"] is None)
				],
				thumbnails=[
					i["image"]
					for i in ret["data"]["artworks"]
					if i["type"] == 3
					and (i["language"] == lang or i["language"] is None)
				],
				trailers=[
					t["url"] for t in ret["data"]["trailers"] if t["language"] == lang
				],
			)

		languages = (
			[*self._languages, ret["data"]["originalLanguage"]]
			if ret["data"]["originalLanguage"] not in self._languages
			else self._languages
		)
		translations = await asyncio.gather(
			*(process_translation(lang) for lang in languages)
		)
		trans = {
			normalize_lang(lang): ts
			for (lang, ts) in zip(languages, translations)
			if ts is not None
		}
		ret = ret["data"]
		return Show(
			original_language=normalize_lang(ret["originalLanguage"]),
			aliases=[x["name"] for x in ret["aliases"]],
			start_air=datetime.strptime(ret["firstAired"], "%Y-%m-%d").date(),
			end_air=datetime.strptime(ret["lastAired"], "%Y-%m-%d").date(),
			status=ShowStatus.FINISHED
			if ret["status"]["name"] == "Ended"
			else ShowStatus.AIRING
			if ret["status"]["name"] == "Continuing"
			else ShowStatus.PLANNED,
			rating=None,
			studios=[
				Studio(
					name=x["name"],
					logos=[],
					external_id={
						self.name: MetadataID(
							x["id"], f"https://thetvdb.com/companies/{x['slug']}"
						)
					},
				)
				for x in ret["companies"]
				if x["companyType"]["companyTypeName"] == "Studio"
			],
			genres=[
				self._genre_map[x["slug"]]
				for x in ret["genres"]
				if self._genre_map[x["slug"]] is not None
			],
			external_id={
				self.name: MetadataID(
					ret["id"], f"https://thetvdb.com/series/{ret['slug']}"
				),
			}
			| self.process_remote_id(
				ret["remoteIds"],
				"themoviedatabase",
				lambda x: f"https://www.themoviedb.org/tv/{x}",
				"TheMovieDB.com",
			)
			| self.process_remote_id(
				ret["remoteIds"],
				"imdb",
				lambda x: f"https://www.imdb.com/title/{x}",
				"IMDB",
			),
			translations=trans,
			seasons=await asyncio.gather(
				*(self.identify_season(x["id"], x["number"]) for x in ret["seasons"])
			),
		)

	def process_remote_id(
		self, ids: dict, name: str, link: Callable[[str], str], tvdb_name: str
	) -> dict:
		id = next((x["id"] for x in ids if x["sourceName"] == tvdb_name), None)
		if id is None:
			return {}
		return {name: MetadataID(id, link(id))}

	@cache(ttl=timedelta(days=1))
	async def identify_season(self, show_id: str, season: int) -> Season:
		# for tvdb, we don't save show_id but the season_id so we don't need to read `season`
		season_id = show_id
		info = await self.get(
			f"seasons/{season_id}/extended",
			not_found_fail=f"Invalid season id {season_id}",
		)
		logger.debug("TVDB send season (%s) data %s", season_id, info)

		async def process_translation(lang: str) -> Optional[SeasonTranslation]:
			try:
				data = await self.get(
					f"seasons/{season_id}/translations/{lang}",
					not_found_fail="Season translation not found",
				)
				logger.debug(
					"TVDB send season (%s) translations (%s) data %s",
					season_id,
					lang,
					data,
				)
				return SeasonTranslation(
					name=data["data"].get("name"),
					overview=data["data"].get("overview"),
					posters=[
						i["image"]
						for i in info["data"]["artwork"]
						if i["type"] == 7
						and (i["language"] == lang or i["language"] is None)
					],
					thumbnails=[
						i["image"]
						for i in info["data"]["artwork"]
						if i["type"] == 8
						and (i["language"] == lang or i["language"] is None)
					],
				)
			except ProviderError:
				return None

		trans = await asyncio.gather(*(process_translation(x) for x in self._languages))
		translations = {
			normalize_lang(lang): tl
			for lang, tl in zip(self._languages, trans)
			if tl is not None
		}

		return Season(
			season_number=info["data"]["number"],
			episodes_count=len(info["data"]["episodes"]),
			start_air=min(
				(
					x["aired"]
					for x in info["data"]["episodes"]
					if x["aired"] is not None
				),
				default=None,
			),
			end_air=max(
				(
					x["aired"]
					for x in info["data"]["episodes"]
					if x["aired"] is not None
				),
				default=None,
			),
			external_id={
				self.name: MetadataID(season_id, None),
			},
			translations=translations,
		)
