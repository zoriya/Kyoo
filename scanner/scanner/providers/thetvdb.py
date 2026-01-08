import asyncio
import os
from datetime import datetime, timedelta
from logging import getLogger
from types import TracebackType
from typing import Any, cast, override

from aiohttp import ClientResponseError, ClientSession
from langcodes import Language
from langcodes.data_dicts import LANGUAGE_REPLACEMENTS

from ..cache import cache
from ..models.entry import Entry, EntryTranslation
from ..models.genre import Genre
from ..models.metadataid import EpisodeId, MetadataId, SeasonId
from ..models.movie import Movie, SearchMovie
from ..models.season import Season, SeasonTranslation
from ..models.serie import SearchSerie, Serie, SerieStatus, SerieTranslation
from ..models.staff import Role
from .provider import Provider, ProviderError

logger = getLogger(__name__)

# tvdb use three letter codes for languages
# (with the terminology code as in 'fra' and not the biblographic code as in 'fre')

# tvdb uses this language code but langcodes doesn't know it.
LANGUAGE_REPLACEMENTS["zhtw"] = "zh-tw"


class TVDB(Provider):
	DEFAULT_API_KEY = "f884eb2c-ae53-4b25-96dd-a61a338b0f68"

	def __init__(self) -> None:
		super().__init__()
		self._client = ClientSession(
			base_url="https://api4.thetvdb.com/v4/",
			headers={
				"User-Agent": "kyoo scanner v5",
			},
		)
		self._api_key = os.environ.get("TVDB_APIKEY") or TVDB.DEFAULT_API_KEY
		self._pin = os.environ.get("TVDB_PIN")

		self._genre_map = {
			"soap": Genre.SOAP,
			"science-fiction": Genre.SCIENCE_FICTION,
			"reality": Genre.REALITY,
			"news": None,
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
		self._roles_map = {
			"Actor": Role.ACTOR,
			"Creator": Role.OTHER,
			"Crew": Role.CREW,
			"Director": Role.DIRECTOR,
			"Executive Producer": Role.OTHER,
			"Guest Star": Role.OTHER,
			"Host": Role.OTHER,
			"Musical Guest": Role.MUSIC,
			"Producer": Role.PRODUCER,
			"Showrunner": Role.OTHER,
			"Writer": Role.WRITTER,
		}

	async def __aenter__(self):
		return self

	async def __aexit__(
		self,
		exc_type: type[BaseException] | None,
		exc_value: BaseException | None,
		traceback: TracebackType | None,
	):
		await self._client.close()

	@property
	@override
	def name(self) -> str:
		return "tvdb"

	# movies are always handled by themoviedb
	@override
	async def search_movies(
		self, title: str, year: int | None, *, language: list[Language]
	) -> list[SearchMovie]:
		raise NotImplementedError

	@override
	async def get_movie(self, external_id: dict[str, str]) -> Movie | None:
		raise NotImplementedError

	@cache(ttl=timedelta(days=30))
	async def login(self):
		if "Authorization" in self._client.headers:
			del self._client.headers["Authorization"]
		async with self._client.post(
			f"login",
			json={
				"apikey": self._api_key,
			}
			| ({"pin": self._pin} if self._pin else {}),
		) as r:
			r.raise_for_status()
			ret = await r.json()
			token = ret["data"]["token"]
			self._client.headers["Authorization"] = f"Bearer {token}"

	async def _get(
		self,
		path: str,
		*,
		params: dict[str, Any] | None = None,
		not_found_fail: str | None = None,
	):
		await self.login()
		params = {k: v for k, v in params.items() if v is not None} if params else {}
		async with self._client.get(path, params=params) as r:
			if not_found_fail and r.status == 404:
				raise ProviderError(not_found_fail)
			if r.status == 429:
				retry_after = r.headers.get("Retry-After")
				delay = float(retry_after) if retry_after else 2.0
				await asyncio.sleep(delay)
				return await self._get(
					path, params=params, not_found_fail=not_found_fail
				)
			if r.status >= 400:
				raise ClientResponseError(
					r.request_info,
					r.history,
					status=r.status,
					message=await r.text(),
					headers=r.headers,
				)
			return await r.json()

	@override
	async def search_series(
		self, title: str, year: int | None, *, language: list[Language]
	) -> list[SearchSerie]:
		ret = await self._get(
			f"search",
			params={
				"query": title,
				"year": year,
				"type": "series",
			},
		)
		return [
			SearchSerie(
				slug=x["slug"],
				name=x["name"],
				description=x.get("overview"),
				start_air=datetime.strptime(x["first_air_time"], "%Y-%m-%d").date()
				if x.get("first_air_time")
				else None,
				end_air=None,
				poster=x["image_url"],
				original_language=Language.get(x["primary_language"]),
				external_id={
					self.name: MetadataId(
						data_id=str(x["tvdb_id"]),
						link=f"https://thetvdb.com/series/{x['slug']}",
					),
				},
			)
			for x in ret["data"]
		]

	@override
	async def get_serie(self, external_id: dict[str, str]) -> Serie | None:
		if self.name not in external_id:
			return None

		ret = (
			await self._get(
				f"series/{external_id[self.name]}/extended",
				params={
					"meta": "translations",
				},
				not_found_fail=f"Could not find on tvdb a serie with id {external_id[self.name]}",
			)
		)["data"]

		entries = await self.get_all_entries(
			external_id[self.name], ret["nameTranslations"]
		)

		return Serie(
			slug=ret["slug"],
			original_language=Language.get(ret["originalLanguage"]),
			genres=[
				cast(Genre, self._genre_map[x["slug"]])
				for x in ret["genres"]
				if self._genre_map[x["slug"]] is not None
			],
			rating=None,  # TODO: maybe use the `score` value.
			status=SerieStatus.FINISHED
			if ret["status"]["name"] == "Ended"
			else SerieStatus.AIRING
			if ret["status"]["name"] == "Continuing"
			else SerieStatus.PLANNED,
			runtime=ret["averageRuntime"],
			start_air=datetime.strptime(ret["firstAired"], "%Y-%m-%d").date(),
			end_air=datetime.strptime(ret["lastAired"], "%Y-%m-%d").date(),
			external_id={
				self.name: MetadataId(
					data_id=ret["id"],
					link=f"https://thetvdb.com/series/{ret['slug']}",
				),
			}
			| self._process_remote_id(ret["remoteIds"]),
			translations={
				Language.get(trans["language"]): SerieTranslation(
					name=trans["name"],
					latin_name=None,
					description=next(
						(
							x["overview"]
							for x in ret["translations"]["overviewTranslations"]
							if x["language"] == trans["language"]
						),
						None,
					),
					tagline=None,
					aliases=[
						x["name"]
						for x in ret["aliases"]
						if x["language"] == trans["language"]
					],
					tags=[],
					poster=self._pick_image(ret["artworks"], 2, trans["language"]),
					logo=self._pick_image(ret["artworks"], 5, trans["language"]),
					thumbnail=self._pick_image(ret["artworks"], 3, trans["language"]),
					banner=self._pick_image(ret["artworks"], 1, trans["language"]),
					trailer=None,
					# trailers=[
					# 	t["url"]
					# 	for t in ret["data"]["trailers"]
					# 	if t["language"] == lang
					# ],
				)
				for trans in ret["translations"]["nameTranslations"]
			},
			seasons=await asyncio.gather(
				*(
					self.get_seasons(x["id"])
					for x in ret["seasons"]
					if x["type"]["type"] == "official"
				)
			),
			entries=entries,
			# TODO: map extra entries in extra instead of entries
			extra=[],
			collections=[],
			# studios=[
			# 	Studio(
			# 		slug=x["slug"],
			# 		name=x["name"],
			# 		logos=[],
			# 		external_id={
			# 			self.name: MetadataID(
			# 				x["id"], f"https://thetvdb.com/companies/{x['slug']}"
			# 			)
			# 		},
			# 	)
			# 	for x in ret["companies"]
			# 	if x["companyType"]["companyTypeName"] == "Studio"
			# ],
			staff=[],
		)

	def _pick_image(self, images: list[Any], type: int, lng: str) -> str | None:
		items = sorted(
			(x for x in images if x["type"] == type),
			key=lambda x: x.get("score", 0),
			reverse=True,
		)

		lngImg = next((x for x in items if x["language"] == lng), None)
		if lngImg:
			return lngImg["image"]

		notext = next((x for x in items if x["language"] == None), None)
		if notext:
			return notext["image"]

		return None

	def _process_remote_id(self, ids: list[dict[str, Any]]) -> dict[str, MetadataId]:
		ret = {}

		imdb = next((x["id"] for x in ids if x["sourceName"] == "IMDB"), None)
		if imdb is not None:
			ret["imdb"] = MetadataId(data_id=imdb)

		from .themoviedatabase import TheMovieDatabase

		tmdb = next((x["id"] for x in ids if x["sourceName"] == "TheMovieDB.com"), None)
		if tmdb is not None:
			ret[TheMovieDatabase.NAME] = MetadataId(data_id=tmdb)

		return ret

	async def get_seasons(self, season_id: str | int) -> Season:
		info = (await self._get(f"seasons/{season_id}/extended"))["data"]

		async def get_translation(lang: str) -> SeasonTranslation:
			data = (
				await self._get(
					f"seasons/{season_id}/translations/{lang}",
					not_found_fail="Season translation not found",
				)
			)["data"]
			return SeasonTranslation(
				name=data.get("name"),
				description=data.get("overview"),
				poster=self._pick_image(info["artwork"], 7, lang),
				thumbnail=self._pick_image(info["artwork"], 8, lang),
				banner=self._pick_image(info["artwork"], 6, lang),
			)

		languages = [
			x
			for lng in (info["nameTranslations"] + info["overviewTranslations"])
			# for some reasons, in the season api they return a list containing a
			# single string with all the languages joined by a ','
			for x in lng.split(",")
		]
		trans = await asyncio.gather(*(get_translation(x) for x in languages))

		return Season(
			season_number=info["number"],
			start_air=min(
				(x["aired"] for x in info["episodes"] if x["aired"] is not None),
				default=None,
			),
			end_air=max(
				(x["aired"] for x in info["episodes"] if x["aired"] is not None),
				default=None,
			),
			external_id={
				self.name: SeasonId(
					serie_id=info["seriesId"],
					season=info["number"],
				),
			},
			translations={Language.get(lang): tl for lang, tl in zip(languages, trans)},
			extra={},
		)

	async def get_all_entries(
		self, serie_id: str | int, langs: list[str]
	) -> list[Entry]:
		async def fetch_all(lang: str) -> list[dict[str, Any]]:
			ret = await self._get(
				f"series/{serie_id}/episodes/default/{lang}",
				not_found_fail=f"Could not find serie with id {serie_id}",
			)
			episodes = ret["data"]["episodes"]
			next = ret["links"]["next"]
			while next != None:
				ret = await self._get(next)
				next = ret["links"]["next"]
				episodes += ret["data"]["episodes"]
			return episodes

		trans = await asyncio.gather(*[fetch_all(lang) for lang in langs])
		entries = trans[0]
		# TODO: map multiples `order=0` to their appropriate number using `airsAfterSeason, airsBeforeSeason, airsBeforeEpisode`
		return [
			Entry(
				kind="movie"
				if entry["isMovie"]
				else "episode"
				if entry["seasonNumber"] != 0
				else "special",
				order=entry["absoluteNumber"],
				runtime=entry["runtime"],
				air_date=datetime.strptime(entry["aired"], "%Y-%m-%d").date()
				if entry["aired"]
				else None,
				thumbnail=f"https://artworks.thetvdb.com{entry["image"]}"
				if entry["image"]
				else None,
				slug=None,
				season_number=entry["seasonNumber"],
				episode_number=entry["number"],
				number=entry["number"],
				external_id={
					self.name: EpisodeId(
						serie_id=str(serie_id),
						season=entry["seasonNumber"],
						episode=entry["number"],
						link=f"https://www.themoviedb.org/tv/{serie_id}/season/{entry['seasonNumber']}/episode/{entry['number']}",
					),
				},
				translations={
					Language.get(lang): EntryTranslation(
						name=tl[i]["name"],
						description=tl[i].get("overview"),
						tagline=None,
						poster=None,
					)
					for lang, tl in zip(langs, trans)
					if "name" in tl[i] and tl[i]["name"]
				},
			)
			for i, entry in enumerate(entries)
		]
