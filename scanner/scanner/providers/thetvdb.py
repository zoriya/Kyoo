import asyncio
import os
from datetime import datetime, timedelta
from logging import getLogger
from types import TracebackType
from typing import Any, Literal, cast, override

from aiohttp import ClientResponseError, ClientSession
from langcodes import Language
from langcodes.data_dicts import LANGUAGE_REPLACEMENTS

from ..cache import cache
from ..models.collection import Collection, CollectionTranslation
from ..models.entry import Entry, EntryTranslation
from ..models.genre import Genre
from ..models.metadataid import EpisodeId, MetadataId, SeasonId
from ..models.movie import Movie, MovieStatus, MovieTranslation, SearchMovie
from ..models.season import Season, SeasonTranslation
from ..models.serie import SearchSerie, Serie, SerieStatus, SerieTranslation
from ..models.staff import Role
from .names import ProviderName
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
		self._image_map = (await self._get("artwork/types"))["data"]
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
		return ProviderName.TVDB

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
	async def get_serie(
		self,
		external_id: dict[str, str],
		*,
		skip_entries=False,
	) -> Serie | None:
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

		entries = (
			await self.get_all_entries(external_id[self.name], ret["nameTranslations"])
			if not skip_entries
			else []
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
				**self._process_remote_id(ret["remoteIds"]),
			},
			translations={
				Language.get(trans["language"]): SerieTranslation(
					name=trans["name"],
					latin_name=None,
					description=next(
						(
							x["overview"]
							for x in (ret["translations"]["overviewTranslations"] or [])
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
					poster=self._pick_image(
						ret["artworks"], "series", "posters", trans["language"]
					),
					logo=self._pick_image(
						ret["artworks"], "series", "icons", trans["language"]
					),
					thumbnail=self._pick_image(
						ret["artworks"], "series", "backgrounds", trans["language"]
					),
					banner=self._pick_image(
						ret["artworks"], "series", "banners", trans["language"]
					),
					trailer=None,
					# trailers=[
					# 	t["url"]
					# 	for t in ret["data"]["trailers"]
					# 	if t["language"] == lang
					# ],
				)
				for trans in ret["translations"]["nameTranslations"]
				if trans.get("isAlias") is None or False
			},
			seasons=await asyncio.gather(
				*(
					self.get_seasons(x["id"])
					for x in ret["seasons"]
					if x["type"]["type"] == "official"
				)
			)
			if not skip_entries
			else [],
			entries=entries,
			# TODO: map extra entries in extra instead of entries
			extra=[],
			collection=await self._get_collection(ret["list"]),
			studios=[],
			staff=[],
		)

	def _pick_image(
		self,
		images: list[Any] | None,
		kind: Literal["series", "season", "episode", "actor", "movie", "company"],
		type: Literal["banners", "posters", "backgrounds", "icons"],
		lng: str,
	) -> str | None:
		# sometimes `artworks` is not even part of the response.
		if images is None:
			return None

		imgId = next(
			x for x in self._image_map if x["recordType"] == kind and x["slug"] == type
		)
		items = sorted(
			(x for x in images if x["type"] == imgId),
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

	def _process_remote_id(
		self, ids: list[dict[str, Any]] | None
	) -> dict[str, MetadataId]:
		# sometimes `remoteIds` is not even part of the response.
		if ids is None:
			return {}

		ret = {}

		imdb = next((x["id"] for x in ids if x["sourceName"] == "IMDB"), None)
		if imdb is not None:
			ret[ProviderName.IMDB] = MetadataId(data_id=imdb)

		tmdb = next((x["id"] for x in ids if x["sourceName"] == "TheMovieDB.com"), None)
		if tmdb is not None:
			ret[ProviderName.TMDB] = MetadataId(data_id=tmdb)

		return ret

	async def _get_collection(self, lists: list[dict[str, Any]]) -> Collection | None:
		col = next(
			# we blacklist mcu (id 4) to prefer sub collections (like `Iron man` instead of a big one)
			(x for x in lists if x.get("isOfficial") == True and x["id"] != 4),
			None,
		)
		if col is None:
			return None

		data = (await self._get(f"lists/{col['id']}/extended"))["data"]
		first_entity = data["entities"][0]
		kind = "movie" if "movieId" in first_entity else "series"
		show = (
			(
				await self._get(
					f"movies/{first_entity['movieId']}/extended",
				)
			)["data"]
			if kind == "movie"
			else (
				await self._get(
					f"series/{first_entity['seriesId']}/extended",
				)
			)["data"]
		)

		async def get_translation(lang: str) -> CollectionTranslation:
			trans = (
				await self._get(
					f"lists/{data['id']}/translations/{lang}",
					not_found_fail="Collection translation not found",
				)
			)["data"]
			return CollectionTranslation(
				name=next(
					(x["name"] for x in trans if x.get("isPrimary")), data["name"]
				),
				latin_name=None,
				description=trans.get("overview"),
				tagline=None,
				aliases=[
					x["name"]
					for x in trans["aliases"]
					if x["language"] == lang and x.get("isAlias")
				],
				tags=[],
				poster=trans.get("image")
				if lang == "eng"
				else self._pick_image(show["artworks"], kind, "posters", lang),
				thumbnail=self._pick_image(show["artworks"], kind, "backgrounds", lang),
				banner=self._pick_image(show["artworks"], kind, "banners", lang),
				logo=self._pick_image(show["artworks"], kind, "icons", lang),
			)

		trans = await asyncio.gather(
			*(get_translation(x) for x in data["nameTranslations"])
		)

		return Collection(
			slug=data["url"],
			original_language=Language.get(show["originalLanguage"]),
			genres=[
				cast(Genre, self._genre_map[x["slug"]])
				for x in show["genres"]
				if self._genre_map[x["slug"]] is not None
			],
			rating=None,
			external_id={
				self.name: MetadataId(
					data_id=data["id"],
					link=f"https://thetvdb.com/lists/{data['url']}",
				)
			},
			translations={
				Language.get(lang): tl
				for lang, tl in zip(data["nameTranslations"], trans)
			},
		)

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
				poster=self._pick_image(info["artwork"], "season", "posters", lang),
				thumbnail=self._pick_image(
					info["artwork"], "season", "backgrounds", lang
				),
				banner=self._pick_image(info["artwork"], "season", "banners", lang),
			)

		languages = set(
			x
			for lng in (info["nameTranslations"] + info["overviewTranslations"])
			# for some reasons, in the season api they return a list containing a
			# single string with all the languages joined by a ','
			for x in lng.split(",")
		)
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

		ret = [
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
				thumbnail=f"https://artworks.thetvdb.com{entry['image']}"
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
						link=f"https://thetvdb.com/series/{serie_id}/episodes/{entry['id']}",
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
				extra={
					"airs_after_season": entry.get("airsAfterSeason"),
					"airs_before_season": entry.get("airsBeforeSeason"),
					"airs_before_episode": entry.get("airsBeforeEpisode"),
					"linked_movie": entry.get("linkedMovie"),
				},
			)
			for i, entry in enumerate(entries)
		]

		for i, entry in enumerate(ret):
			if entry.extra["linked_movie"]:
				ret[i] = await self.process_movie_entry(entry)

			if entry.order != 0:
				continue

			if entry.extra["airs_after_season"] is not None:
				before = max(
					(
						x.order
						for x in ret
						if x.season_number == entry.extra["airs_after_season"]
					),
					default=0,
				)
				after = min((x.order for x in ret if x.order > before), default=before)
				entry.order = (before + after) / 2
			elif entry.extra["airs_before_season"] is not None:
				before = (
					next(
						(
							x.order
							for x in ret
							if x.season_number == entry.extra["airs_before_season"]
							and x.episode_number == entry.extra["airs_before_episode"]
						),
						0,
					)
					if entry.extra["airs_before_episode"]
					else min(
						(
							x.order
							for x in ret
							if x.season_number == entry.extra["airs_before_season"]
						),
						default=0,
					)
				)
				after = max((x.order for x in ret if x.order < before), default=0)
				entry.order = (after + before) / 2

		return ret

	async def process_movie_entry(self, entry: Entry) -> Entry:
		ret = (
			await self._get(
				f"movies/{entry.extra['linked_movie']}/extended",
				params={
					"meta": "translations",
				},
			)
		)["data"]

		# keep entry's metadata from series api, it's the same.
		entry.slug = ret["slug"]
		entry.translations = {
			Language.get(trans["language"]): EntryTranslation(
				name=trans["name"],
				description=next(
					(
						x["overview"]
						for x in ret["translations"]["overviewTranslations"]
						if x["language"] == trans["language"]
					),
					None,
				),
				tagline=trans.get("tagline")
				or next(
					(
						x.get("tagline")
						for x in ret["translations"]["overviewTranslations"]
						if x["language"] == trans["language"]
					),
					None,
				),
				poster=self._pick_image(
					ret["artworks"], "episode", "posters", trans["language"]
				),
			)
			for trans in ret["translations"]["nameTranslations"]
			if trans.get("isAlias") is None or False
		}
		entry.external_id = {
			self.name: MetadataId(
				data_id=ret["id"],
				link=f"https://thetvdb.com/movies/{ret['slug']}",
			),
			**self._process_remote_id(ret["remoteIds"]),
		}

		return entry

	# movies are always handled by themoviedb, we only complete collections for them
	@override
	async def search_movies(
		self, title: str, year: int | None, *, language: list[Language]
	) -> list[SearchMovie]:
		raise NotImplementedError

	@override
	async def get_movie(self, external_id: dict[str, str]) -> Movie | None:
		if self.name not in external_id:
			if ProviderName.IMDB in external_id:
				search = await self._get(
					f"search/remoteid/{external_id[ProviderName.IMDB]}"
				)
				if len(search["data"]) > 0:
					id = search["data"][0].get("movie")["id"]
					return await self.get_movie({self.name: id})
			return None

		ret = (
			await self._get(
				f"movies/{external_id[self.name]}/extended",
				params={
					"meta": "translations",
				},
				not_found_fail=f"Could not find on tvdb a movie with id {external_id[self.name]}",
			)
		)["data"]

		return Movie(
			slug=ret["slug"],
			original_language=Language.get(ret["originalLanguage"]),
			genres=[
				cast(Genre, self._genre_map[x["slug"]])
				for x in ret["genres"]
				if self._genre_map[x["slug"]] is not None
			],
			rating=None,  # TODO: maybe use the `score` value.
			status=MovieStatus.FINISHED
			if ret["status"]["name"] == "Ended"
			else MovieStatus.PLANNED,
			runtime=ret["averageRuntime"],
			air_date=datetime.strptime(ret["first_release"]["date"], "%Y-%m-%d").date()
			if ret.get("first_release") and ret["first_release"].get("date")
			else None,
			external_id={
				self.name: MetadataId(
					data_id=ret["id"],
					link=f"https://thetvdb.com/series/{ret['slug']}",
				),
				**self._process_remote_id(ret["remoteIds"]),
			},
			translations={
				Language.get(trans["language"]): MovieTranslation(
					name=trans["name"],
					latin_name=None,
					description=next(
						(
							x["overview"]
							for x in (ret["translations"]["overviewTranslations"] or [])
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
					poster=self._pick_image(
						ret["artworks"], "movie", "posters", trans["language"]
					),
					logo=self._pick_image(
						ret["artworks"], "movie", "icons", trans["language"]
					),
					thumbnail=self._pick_image(
						ret["artworks"], "movie", "backgrounds", trans["language"]
					),
					banner=self._pick_image(
						ret["artworks"], "movie", "banners", trans["language"]
					),
					trailer=None,
					# trailers=[
					# 	t["url"]
					# 	for t in ret["data"]["trailers"]
					# 	if t["language"] == lang
					# ],
				)
				for trans in ret["translations"]["nameTranslations"]
				if trans.get("isAlias") is None or False
			},
			collection=await self._get_collection(ret["list"]),
			studios=[],
			staff=[],
		)
