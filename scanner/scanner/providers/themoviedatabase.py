import asyncio
import os
from collections.abc import Generator
from datetime import datetime
from logging import getLogger
from statistics import mean
from types import TracebackType
from typing import Any, cast, override

from aiohttp import ClientSession
from langcodes import Language

from ..models.collection import Collection, CollectionTranslation
from ..models.entry import Entry, EntryTranslation
from ..models.genre import Genre
from ..models.metadataid import EpisodeId, MetadataId, SeasonId
from ..models.movie import Movie, MovieStatus, MovieTranslation, SearchMovie
from ..models.season import Season, SeasonTranslation
from ..models.serie import SearchSerie, Serie, SerieStatus, SerieTranslation
from ..models.staff import Character, Person, Role, Staff
from ..models.studio import Studio, StudioTranslation
from ..utils import clean, to_slug
from .provider import Provider, ProviderError

logger = getLogger(__name__)


class TheMovieDatabase(Provider):
	THEMOVIEDB_API_ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJjOWYzMjhhMDEwMTFiMjhmMjI0ODM3MTczOTVmYzNmYSIsIm5iZiI6MTU4MTYzMTExOS44NjgsInN1YiI6IjVlNDVjNjhmODNlZTY3MDAxMTFmMmU5NiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.CeXrQwgB3roCAVs-Z2ayLRx99VIJbym7XSpcRjGzyLA"

	def __init__(self) -> None:
		super().__init__()
		bearer = (
			os.environ.get("THEMOVIEDB_API_ACCESS_TOKEN")
			or TheMovieDatabase.THEMOVIEDB_API_ACCESS_TOKEN
		)
		self._client = ClientSession(
			base_url="https://api.themoviedb.org/3/",
			headers={
				"User-Agent": "kyoo scanner v5",
				"Authorization": f"Bearer {bearer}",
			},
		)
		self._image_path = "https://image.tmdb.org/t/p/original"
		self._genre_map = {
			28: Genre.ACTION,
			12: Genre.ADVENTURE,
			16: Genre.ANIMATION,
			35: Genre.COMEDY,
			80: Genre.CRIME,
			99: Genre.DOCUMENTARY,
			18: Genre.DRAMA,
			10751: Genre.FAMILY,
			14: Genre.FANTASY,
			36: Genre.HISTORY,
			27: Genre.HORROR,
			10402: Genre.MUSIC,
			9648: Genre.MYSTERY,
			10749: Genre.ROMANCE,
			878: Genre.SCIENCE_FICTION,
			53: Genre.THRILLER,
			10752: Genre.WAR,
			37: Genre.WESTERN,
			10759: [Genre.ACTION, Genre.ADVENTURE],
			10762: Genre.KIDS,
			10764: Genre.REALITY,
			10765: [Genre.SCIENCE_FICTION, Genre.FANTASY],
			10766: Genre.SOAP,
			10767: Genre.TALK,
			10768: [Genre.WAR, Genre.POLITICS],
		}
		self._roles_map = {
			"Camera": Role.OTHER,
			"Costume & Make-Up": Role.OTHER,
			"Lighting": Role.OTHER,
			"Art": Role.OTHER,
			"Visual Effects": Role.OTHER,
			"Crew": Role.CREW,
			"Writing": Role.WRITTER,
			"Production": Role.PRODUCER,
			"Editing": Role.OTHER,
			"Directing": Role.DIRECTOR,
			"Sound": Role.MUSIC,
			"Actors": Role.ACTOR,
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
		return "themoviedatabase"

	@override
	async def search_movies(
		self, title: str, year: int | None, *, language: list[Language]
	) -> list[SearchMovie]:
		search = (
			await self._get(
				"search/movie",
				params={
					"query": title,
					"year": year,
					"languages": [str(x) for x in language],
				},
			)
		)["results"]
		search = self._sort_search(search, title, year)
		return [
			SearchMovie(
				slug=to_slug(x["title"]),
				name=x["title"],
				description=x["overview"],
				air_date=datetime.strptime(x["release_date"], "%Y-%m-%d").date()
				if x["release_date"]
				else None,
				poster=self._map_image(x["poster_path"]),
				original_language=Language.get(x["original_language"]),
				external_id={
					self.name: MetadataId(
						data_id=str(x["id"]),
						link=f"https://www.themoviedb.org/movie/{x['id']}",
					)
				},
			)
			for x in search
		]

	@override
	async def get_movie(self, external_id: dict[str, str]) -> Movie | None:
		# TODO: fallback to search via another id
		if self.name not in external_id:
			return None

		movie = await self._get(
			f"movie/{external_id[self.name]}",
			params={
				"append_to_response": "alternative_titles,videos,credits,keywords,images,translations",
			},
		)

		return Movie(
			slug=to_slug(movie["title"]),
			original_language=Language.get(movie["original_language"]),
			genres=self._map_genres(x["id"] for x in movie["genres"]),
			rating=round(float(movie["vote_average"]) * 10),
			status=MovieStatus.FINISHED
			if movie["status"] == "Released"
			else MovieStatus.PLANNED,
			runtime=int(movie["runtime"]) if movie["runtime"] is not None else None,
			air_date=datetime.strptime(movie["release_date"], "%Y-%m-%d").date()
			if movie["release_date"]
			else None,
			external_id=(
				{
					self.name: MetadataId(
						data_id=str(movie["id"]),
						link=f"https://www.themoviedb.org/movie/{movie['id']}",
					)
				}
				| (
					{
						"imdb": MetadataId(
							data_id=str(movie["imdb_id"]),
							link=f"https://www.imdb.com/title/{movie['imdb_id']}",
						)
					}
					if movie["imdb_id"]
					else {}
				)
			),
			translations={
				Language.get(
					f"{trans['iso_639_1']}-{trans['iso_3166_1']}"
				): MovieTranslation(
					name=clean(trans["data"]["title"])
					or (
						clean(movie["original_title"])
						if movie["original_language"] == trans["iso_639_1"]
						else None
					)
					or movie["title"],
					latin_name=next(
						(
							x["title"]
							for x in movie["alternative_titles"]["titles"]
							if x["iso_3166_1"] == trans["iso_3166_1"]
							and x["type"] == "Romaji"
						),
						None,
					),
					description=clean(trans["data"]["overview"]),
					tagline=clean(trans["data"]["tagline"]),
					aliases=[
						x["title"]
						for x in movie["alternative_titles"]["titles"]
						if x["iso_3166_1"] == trans["iso_3166_1"]
					],
					tags=[x["name"] for x in movie["keywords"]["keywords"]],
					poster=self._pick_image(movie, trans["iso_639_1"], "posters"),
					logo=self._pick_image(movie, trans["iso_639_1"], "logos"),
					banner=None,
					thumbnail=self._pick_image(movie, trans["iso_639_1"], "backdrops"),
					trailer=None,
					# TODO: should the trailer be added? or all of them as extra?
					# [
					# 	f"https://www.youtube.com/watch?v={x['key']}"
					# 	for x in movie["videos"]["results"]
					# 	if x["type"] == "Trailer" and x["site"] == "YouTube"
					# ],
				)
				for trans in movie["translations"]["translations"]
			},
			collections=[
				await self._get_collection(movie["belongs_to_collection"]["id"])
			]
			if movie["belongs_to_collection"] is not None
			else [],
			studios=[self._map_studio(x) for x in movie["production_companies"]],
			# TODO: add crew
			staff=[self._map_staff(x) for x in movie["credits"]["cast"]],
		)

	@override
	async def search_series(
		self, title: str, year: int | None, *, language: list[Language]
	) -> list[SearchSerie]:
		search = (
			await self._get(
				"search/tv",
				params={
					"query": title,
					"year": year,
					"languages": [str(x) for x in language],
				},
			)
		)["results"]
		search = self._sort_search(search, title, year)
		return [
			SearchSerie(
				slug=to_slug(x["name"]),
				name=x["name"],
				description=x["overview"],
				start_air=datetime.strptime(x["first_air_date"], "%Y-%m-%d").date()
				if x["first_air_date"]
				else None,
				end_air=None,
				poster=self._map_image(x["poster_path"]),
				original_language=Language.get(x["original_language"]),
				external_id={
					self.name: MetadataId(
						data_id=str(x["id"]),
						link=f"https://www.themoviedb.org/tv/{x['id']}",
					)
				},
			)
			for x in search
		]

	@override
	async def get_serie(self, external_id: dict[str, str]) -> Serie | None:
		# TODO: fallback to search via another id
		if self.name not in external_id:
			return None

		serie = await self._get(
			f"tv/{external_id[self.name]}",
			params={
				"append_to_response": "alternative_titles,videos,credits,keywords,images,external_ids,translations",
			},
		)
		seasons = await asyncio.gather(
			*[
				self._get_season(serie["id"], x["season_number"])
				for x in serie["seasons"]
			]
		)
		entries = await self._get_all_entries(serie["id"], seasons)

		return Serie(
			slug=to_slug(serie["name"]),
			original_language=Language.get(serie["original_language"]),
			genres=self._map_genres(x["id"] for x in serie["genres"]),
			rating=round(float(serie["vote_average"]) * 10),
			status=SerieStatus.FINISHED
			if serie["status"] == "Released"
			else SerieStatus.AIRING
			if serie["in_production"]
			else SerieStatus.FINISHED,
			runtime=serie["last_episode_to_air"]["runtime"]
			if serie["last_episode_to_air"]
			else None,
			start_air=datetime.strptime(serie["first_air_date"], "%Y-%m-%d").date()
			if serie["first_air_date"]
			else None,
			end_air=datetime.strptime(serie["last_air_date"], "%Y-%m-%d").date()
			if serie["last_air_date"]
			else None,
			external_id={
				self.name: MetadataId(
					data_id=str((serie["id"])),
					link=f"https://www.themoviedb.org/tv/{serie['id']}",
				),
			}
			| (
				{
					"imdb": MetadataId(
						data_id=str(serie["external_ids"]["imdb_id"]),
						link=f"https://www.imdb.com/title/{serie['external_ids']['imdb_id']}",
					)
				}
				if serie["external_ids"]["imdb_id"]
				else {}
			)
			| (
				{
					"tvdb": MetadataId(
						data_id=str(serie["external_ids"]["tvdb_id"]),
						link=None,
					)
				}
				if serie["external_ids"]["tvdb_id"]
				else {}
			),
			translations={
				Language.get(
					f"{trans['iso_639_1']}-{trans['iso_3166_1']}"
				): SerieTranslation(
					name=clean(trans["data"]["name"])
					or (
						clean(serie["original_name"])
						if serie["original_language"] == trans["iso_639_1"]
						else None
					)
					or serie["name"],
					latin_name=next(
						(
							x["title"]
							for x in serie["alternative_titles"]["results"]
							if x["iso_3166_1"] == trans["iso_3166_1"]
							and x["type"] == "Romaji"
						),
						None,
					),
					description=clean(trans["data"]["overview"]),
					tagline=clean(trans["data"]["tagline"]),
					aliases=[
						x["title"]
						for x in serie["alternative_titles"]["results"]
						if x["iso_3166_1"] == trans["iso_3166_1"]
					],
					tags=[x["name"] for x in serie["keywords"]["results"]],
					poster=self._pick_image(serie, trans["iso_639_1"], "posters"),
					logo=self._pick_image(serie, trans["iso_639_1"], "logos"),
					banner=None,
					thumbnail=self._pick_image(serie, trans["iso_639_1"], "backdrops"),
					trailer=None,
					# TODO: should the trailer be added? or all of them as extra?
					# [
					# 	f"https://www.youtube.com/watch?v={x['key']}"
					# 	for x in show["videos"]["results"]
					# 	if x["type"] == "Trailer" and x["site"] == "YouTube"
					# ],
				)
				for trans in serie["translations"]["translations"]
			},
			seasons=seasons,
			entries=entries,
			extra=[],
			collections=[],
			studios=[self._map_studio(x) for x in serie["production_companies"]],
			# TODO: add crew
			staff=[self._map_staff(x) for x in serie["credits"]["cast"]],
		)

	async def _get_season(self, serie_id: str | int, season_number: int) -> Season:
		season = await self._get(
			f"tv/{serie_id}/season/{season_number}",
			params={
				"append_to_response": "translations,images",
			},
		)

		return Season(
			season_number=season["season_number"],
			start_air=datetime.strptime(season["air_date"], "%Y-%m-%d").date()
			if season["air_date"]
			else None,
			end_air=None,
			external_id={
				self.name: SeasonId(
					serie_id=str(serie_id),
					season=season["season_number"],
					link=f"https://www.themoviedb.org/tv/{serie_id}/season/{season['season_number']}",
				)
			},
			translations={
				Language.get(
					f"{trans['iso_639_1']}-{trans['iso_3166_1']}"
				): SeasonTranslation(
					name=clean(trans["data"]["name"]),
					description=clean(trans["data"]["overview"]),
					poster=self._pick_image(season, trans["iso_639_1"], "posters"),
					thumbnail=None,
					banner=None,
				)
				for trans in season["translations"]["translations"]
			},
			extra={
				"first_entry": next(
					(x["episode_number"] for x in season["episodes"]), None
				),
				"entries_count": len(season["episodes"]),
			},
		)

	async def _get_all_entries(
		self, serie_id: str | int, seasons: list[Season]
	) -> list[Entry]:
		# TODO: batch those
		ret = await asyncio.gather(
			*[
				self._get_entry(serie_id, s.season_number, s.extra["first_entry"] + e)
				for s in seasons
				for e in range(0, s.extra["entries_count"])
			]
		)

		# find the absolute ordering of entries (to set the `order` field)
		try:
			groups = await self._get(f"tv/{serie_id}/episode_groups")
			group = max(
				(x for x in groups["results"] if x["type"] == 2),
				key=lambda x: x["episode_count"],
				default=None,
			)
			# if it doesn't have 75% of all episodes, it's probably unmaintained. keep default order
			if group is None or group["episode_count"] < len(ret) // 1.5:
				raise ProviderError("No valid absolute ordering group.")

			# groups of groups (each `episode_group` contains a `group` that acts like a season)
			gog = await self._get(f"tv/episode_group/{group['id']}")
			episodes = [
				ep
				for grp in sorted(gog["groups"], key=lambda x: x["order"])
				for ep in sorted(grp["episodes"], key=lambda x: x["order"])
			]
			# the episode number of the first episode of each season
			# this is because tmdb has some weird absolute groups, for example:
			# one piece's s22e1089 is the first ep of s22.
			# this is because episode_numbers simply don't reset after season start
			#   (eg s21e1088 is the last ep of s21)
			season_starts = [s.extra["first_entry"] for s in seasons]

			if len(episodes) != len(ret):
				logger.warning(
					f"Incomplete absolute group for show {serie_id}. Filling missing values by assuming season/episode order is ascending."
				)
				episodes += [
					{"season_number": s.season_number, "episode_number": e}
					for s in seasons
					for e in range(1, s.extra["entries_count"] + 1)
					if not any(
						x["season_number"] == s.season_number
						and (
							x["episode_number"] == e
							# take into account weird absolute (for example one piece, episodes are not reset to 1 when the season starts)
							or x["episode_number"]
							== season_starts[s.season_number - 1] + e
						)
						for x in episodes
					)
				]
			for ep in ret:
				snbr = cast(int, ep.season_number)
				enbr = cast(int, ep.episode_number)
				ep.order = next(
					# Using absolute + 1 since the array is 0based (absolute episode 1 is at index 0)
					i + 1
					for i, x in enumerate(episodes)
					if x["season_number"] == snbr
					and (
						x["episode_number"] == enbr
						# don't forget weird numbering
						or x["episode_number"] == enbr + season_starts[snbr - 1]
					)
				)
		except Exception as e:
			if not isinstance(e, ProviderError):
				logger.exception(
					"Could not retrieve absolute ordering information", exc_info=e
				)
			ret = sorted(ret, key=lambda ep: (ep.season_number, ep.episode_number))
			for order, ep in enumerate(ret):
				ep.order = order + 1

		return ret

	async def _get_entry(
		self,
		serie_id: str | int,
		season: int,
		episode_nbr: int,
	) -> Entry:
		episode = await self._get(
			f"tv/{serie_id}/season/{season}/episode/{episode_nbr}",
			params={
				"append_to_response": "translations",
			},
		)

		return Entry(
			kind="episode" if episode["season_number"] != 0 else "special",
			order=0,
			runtime=int(episode["runtime"]) if episode["runtime"] is not None else None,
			air_date=datetime.strptime(episode["air_date"], "%Y-%m-%d").date()
			if episode["air_date"]
			else None,
			thumbnail=self._map_image(episode["still_path"]),
			slug=None,
			season_number=episode["season_number"],
			episode_number=episode["episode_number"],
			number=episode["episode_number"],
			external_id={
				self.name: EpisodeId(
					serie_id=str(serie_id),
					season=episode["season_number"],
					episode=episode["episode_number"],
					link=f"https://www.themoviedb.org/tv/{serie_id}/season/{episode['season_number']}/episode/{episode['episode_number']}",
				),
			},
			translations={
				Language.get(
					f"{trans['iso_639_1']}-{trans['iso_3166_1']}"
				): EntryTranslation(
					name=clean(trans["data"]["name"]),
					description=clean(trans["data"]["overview"]),
					tagline=None,
					poster=None,
				)
				for trans in episode["translations"]["translations"]
			},
		)

	async def _get_collection(self, provider_id: str | int) -> Collection:
		collection = await self._get(
			f"collection/{provider_id}",
			params={
				"append_to_response": "images,translations",
			},
		)

		return Collection(
			slug=to_slug(collection["name"]),
			# assume all parts are in the same language
			original_language=Language.get(collection["parts"][0]["original_language"]),
			genres=[
				y for x in collection["parts"] for y in self._map_genres(x["genre_ids"])
			],
			rating=round(
				mean(float(x["vote_average"]) * 10 for x in collection["parts"])
			),
			external_id={
				self.name: MetadataId(
					data_id=str(collection["id"]),
					link=f"https://www.themoviedb.org/collection/{collection['id']}",
				)
			},
			translations={
				Language.get(
					f"{trans['iso_639_1']}-{trans['iso_3166_1']}"
				): CollectionTranslation(
					name=clean(trans["data"]["title"]) or collection["name"],
					latin_name=None,
					description=trans["data"]["overview"],
					tagline=None,
					aliases=[],
					tags=[],
					poster=self._pick_image(collection, trans["iso_639_1"], "posters"),
					thumbnail=self._pick_image(
						collection, trans["iso_639_1"], "backdrops"
					),
					banner=None,
					logo=None,
				)
				for trans in collection["translations"]["translations"]
			},
		)

	def _sort_search(self, search: list[Any], name: str, year: int | None) -> Any:
		results = search

		# Find perfect match by year since sometime tmdb decides to discard the year parameter.
		if year:
			results = [
				x
				for x in search
				if ("first_air_date" in x and x["first_air_date"].startswith(str(year)))
				or ("release_date" in x and x["release_date"].startswith(str(year)))
			]
			if not results:
				results = search

		# If there is a perfect match use it (and if there are multiple, use the most popular one)
		res = sorted(
			(
				x
				for x in results
				if ("name" in x and x["name"].casefold() == name.casefold())
				or ("title" in x and x["title"].casefold() == name.casefold())
			),
			key=lambda x: (x["vote_count"], x["popularity"]),
			reverse=True,
		)
		if res:
			results = res
		else:
			# Ignore totally unpopular shows or unknown ones.
			# sorted is stable and False<True so doing this puts baddly rated items at the end of the list.
			results = sorted(
				results, key=lambda x: x["vote_count"] < 5 or x["popularity"] < 5
			)

		return results

	async def _get(
		self,
		path: str,
		*,
		params: dict[str, Any] | None = None,
		not_found_fail: str | None = None,
	):
		params = {k: v for k, v in params.items() if v is not None} if params else {}
		async with self._client.get(path, params=params) as r:
			if not_found_fail and r.status == 404:
				raise ProviderError(not_found_fail)
			r.raise_for_status()
			return await r.json()

	def _map_genres(self, genres: Generator[int]) -> list[Genre]:
		def flatten(x: Genre | list[Genre] | list[Genre | list[Genre]]) -> list[Genre]:
			if isinstance(x, list):
				return [j for i in x for j in flatten(i)]
			return [x]

		return flatten([self._genre_map[x] for x in genres if x in self._genre_map])

	def _map_studio(self, company: dict[str, Any]) -> Studio:
		return Studio(
			slug=to_slug(company["name"]),
			external_id={
				self.name: MetadataId(
					data_id=str(company["id"]),
					link=f"https://www.themoviedb.org/company/{company['id']}",
				)
			},
			translations={
				"en": StudioTranslation(
					name=company["name"],
					logo=self._map_image(company["logo_path"])
					if "logo_path" in company
					else None,
				),
			},
		)

	def _map_staff(self, person: dict[str, Any]) -> Staff:
		return Staff(
			kind=self._roles_map.get(person["known_for_department"], Role.OTHER),
			character=Character(
				name=person["character"],
				latin_name=None,
				image=None,
			),
			staff=Person(
				slug=to_slug(person["name"]),
				name=person["original_name"],
				latin_name=person["name"],
				image=self._map_image(person["profile_path"]),
				external_id={
					self.name: MetadataId(
						data_id=str(person["id"]),
						link=f"https://www.themoviedb.org/person/{person['id']}",
					)
				},
			),
		)

	def _map_image(self, image: str | None) -> str | None:
		if not image:
			return None
		return self._image_path + image

	def _pick_image(self, item: dict[str, Any], lng: str, key: str) -> str | None:
		images = sorted(
			item["images"][key],
			key=lambda x: (x.get("vote_average", 0), x.get("width", 0)),
			reverse=True,
		)

		# check images in your language
		localized = next((x for x in images if x["iso_639_1"] == lng), None)
		if localized:
			return self._image_path + localized["file_path"]
		# if failed, check images without text
		notext = next((x for x in images if x["iso_639_1"] == None), None)
		if notext:
			return self._image_path + notext["file_path"]
		# take a random image, it's better than nothing
		random_img = next((x for x in images if x["iso_639_1"] == None), None)
		if random_img:
			return self._image_path + random_img["file_path"]
		return None
