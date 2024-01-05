import asyncio
import logging
from aiohttp import ClientSession
from datetime import datetime
from typing import Awaitable, Callable, Dict, List, Optional, Any, TypeVar
from providers.implementations.thexem import TheXem

from providers.utils import ProviderError

from ..provider import Provider
from ..types.movie import Movie, MovieTranslation, Status as MovieStatus
from ..types.season import Season, SeasonTranslation
from ..types.episode import Episode, EpisodeTranslation, PartialShow
from ..types.studio import Studio
from ..types.genre import Genre
from ..types.metadataid import MetadataID
from ..types.show import Show, ShowTranslation, Status as ShowStatus
from ..types.collection import Collection, CollectionTranslation


class TheMovieDatabase(Provider):
	def __init__(self, client: ClientSession, api_key: str, xem: TheXem) -> None:
		super().__init__()
		self._client = client
		self._xem = xem
		self.base = "https://api.themoviedb.org/3"
		self.api_key = api_key
		self.genre_map = {
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
		}
		self.absolute_episode_cache = {}

	@property
	def name(self) -> str:
		return "themoviedatabase"

	async def get(
		self,
		path: str,
		*,
		params: dict[str, Any] = {},
		not_found_fail: Optional[str] = None,
	):
		params = {k: v for k, v in params.items() if v is not None}
		async with self._client.get(
			f"{self.base}/{path}", params={"api_key": self.api_key, **params}
		) as r:
			if not_found_fail and r.status == 404:
				raise ProviderError(not_found_fail)
			r.raise_for_status()
			return await r.json()

	T = TypeVar("T")

	def merge_translations(self, host, translations, *, languages: list[str]):
		host.translations = {
			k: v.translations[k] for k, v in zip(languages, translations)
		}
		return host

	async def process_translations(
		self,
		for_language: Callable[[str], Awaitable[T]],
		languages: list[str],
		post_merge: Callable[[T, list[T]], T] | None = None,
	) -> T:
		tasks = map(lambda lng: for_language(lng), languages)
		items: list[Any] = await asyncio.gather(*tasks)
		item = self.merge_translations(items[0], items, languages=languages)
		if post_merge:
			item = post_merge(item, items)
		return item

	def get_image(self, images: list[Dict[str, Any]]) -> list[str]:
		return [
			f"https://image.tmdb.org/t/p/original{x['file_path']}"
			for x in images
			if x["file_path"]
		]

	def to_studio(self, company: dict[str, Any]) -> Studio:
		return Studio(
			name=company["name"],
			logos=[f"https://image.tmdb.org/t/p/original{company['logo_path']}"]
			if "logo_path" in company
			else [],
			external_id={
				self.name: MetadataID(
					company["id"], f"https://www.themoviedb.org/company/{company['id']}"
				)
			},
		)

	async def identify_movie(
		self, name: str, year: Optional[int], *, language: list[str]
	) -> Movie:
		search_results = (
			await self.get("search/movie", params={"query": name, "year": year})
		)["results"]
		if len(search_results) == 0:
			raise ProviderError(f"No result for a movie named: {name}")
		search = self.get_best_result(search_results, name, year)
		movie_id = search["id"]
		if search["original_language"] not in language:
			language.append(search["original_language"])

		async def for_language(lng: str) -> Movie:
			movie = await self.get(
				f"movie/{movie_id}",
				params={
					"language": lng,
					"append_to_response": "alternative_titles,videos,credits,keywords,images",
				},
			)
			logging.debug("TMDb responded: %s", movie)
			# TODO: Use collection data

			ret = Movie(
				original_language=movie["original_language"],
				aliases=[x["title"] for x in movie["alternative_titles"]["titles"]],
				air_date=datetime.strptime(movie["release_date"], "%Y-%m-%d").date()
				if movie["release_date"]
				else None,
				status=MovieStatus.FINISHED
				if movie["status"] == "Released"
				else MovieStatus.PLANNED,
				rating=round(float(movie["vote_average"]) * 10),
				runtime=int(movie["runtime"]),
				studios=[self.to_studio(x) for x in movie["production_companies"]],
				genres=[
					self.genre_map[x["id"]]
					for x in movie["genres"]
					if x["id"] in self.genre_map
				],
				external_id=(
					{
						self.name: MetadataID(
							movie["id"],
							f"https://www.themoviedb.org/movie/{movie['id']}",
						)
					}
					| (
						{
							"imdb": MetadataID(
								movie["imdb_id"],
								f"https://www.imdb.com/title/{movie['imdb_id']}",
							)
						}
						if movie["imdb_id"]
						else {}
					)
				),
				collections=[
					Collection(
						external_id={
							self.name: MetadataID(
								movie["belongs_to_collection"]["id"],
								f"https://www.themoviedb.org/collection/{movie['belongs_to_collection']['id']}",
							)
						},
					)
				]
				if movie["belongs_to_collection"] is not None
				else [],
				# TODO: Add cast information
			)
			translation = MovieTranslation(
				name=movie["title"],
				tagline=movie["tagline"] if movie["tagline"] else None,
				tags=list(map(lambda x: x["name"], movie["keywords"]["keywords"])),
				overview=movie["overview"],
				posters=self.get_image(
					movie["images"]["posters"]
					+ (
						[{"file_path": movie["poster_path"]}]
						if lng == search["original_language"]
						else []
					)
				),
				logos=self.get_image(movie["images"]["logos"]),
				thumbnails=self.get_image(
					movie["images"]["backdrops"]
					+ (
						[{"file_path": movie["backdrop_path"]}]
						if lng == search["original_language"]
						else []
					)
				),
				trailers=[
					f"https://www.youtube.com/watch?v={x['key']}"
					for x in movie["videos"]["results"]
					if x["type"] == "Trailer" and x["site"] == "YouTube"
				],
			)
			ret.translations = {lng: translation}
			return ret

		return await self.process_translations(for_language, language)

	async def identify_show(
		self,
		pshow: PartialShow,
		*,
		language: list[str],
	) -> Show:
		show_id = pshow.external_id[self.name].data_id
		if pshow.original_language not in language:
			language.append(pshow.original_language)

		async def for_language(lng: str) -> Show:
			show = await self.get(
				f"tv/{show_id}",
				params={
					"language": lng,
					"append_to_response": "alternative_titles,videos,credits,keywords,images,external_ids",
				},
			)
			logging.debug("TMDb responded: %s", show)

			ret = Show(
				original_language=show["original_language"],
				aliases=[x["title"] for x in show["alternative_titles"]["results"]],
				start_air=datetime.strptime(show["first_air_date"], "%Y-%m-%d").date()
				if show["first_air_date"]
				else None,
				end_air=datetime.strptime(show["last_air_date"], "%Y-%m-%d").date()
				if show["last_air_date"]
				else None,
				status=ShowStatus.FINISHED
				if show["status"] == "Released"
				else ShowStatus.AIRING
				if show["in_production"]
				else ShowStatus.FINISHED,
				rating=round(float(show["vote_average"]) * 10),
				studios=[self.to_studio(x) for x in show["production_companies"]],
				genres=[
					self.genre_map[x["id"]]
					for x in show["genres"]
					if x["id"] in self.genre_map
				],
				external_id={
					self.name: MetadataID(
						show["id"], f"https://www.themoviedb.org/tv/{show['id']}"
					),
				}
				| (
					{
						"imdb": MetadataID(
							show["external_ids"]["imdb_id"],
							f"https://www.imdb.com/title/{show['external_ids']['imdb_id']}",
						)
					}
					if show["external_ids"]["imdb_id"]
					else {}
				)
				| (
					{"tvdb": MetadataID(show["external_ids"]["tvdb_id"], link=None)}
					if show["external_ids"]["tvdb_id"]
					else {}
				),
				seasons=[
					self.to_season(x, language=lng, show_id=show["id"])
					for x in show["seasons"]
				],
				# TODO: Add cast information
			)
			translation = ShowTranslation(
				name=show["name"],
				tagline=show["tagline"] if show["tagline"] else None,
				tags=list(map(lambda x: x["name"], show["keywords"]["results"])),
				overview=show["overview"],
				posters=self.get_image(
					show["images"]["posters"]
					+ (
						[{"file_path": show["poster_path"]}]
						if lng == pshow.original_language
						else []
					)
				),
				logos=self.get_image(show["images"]["logos"]),
				thumbnails=self.get_image(
					show["images"]["backdrops"]
					+ (
						[{"file_path": show["backdrop_path"]}]
						if lng == pshow.original_language
						else []
					)
				),
				trailers=[
					f"https://www.youtube.com/watch?v={x['key']}"
					for x in show["videos"]["results"]
					if x["type"] == "Trailer" and x["site"] == "YouTube"
				],
			)
			ret.translations = {lng: translation}
			return ret

		def merge_seasons_translations(item: Show, items: list[Show]) -> Show:
			item.seasons = [
				self.merge_translations(
					season,
					[
						next(
							y
							for y in x.seasons
							if y.season_number == season.season_number
						)
						for x in items
					],
					languages=language,
				)
				for season in item.seasons
			]
			return item

		ret = await self.process_translations(
			for_language, language, merge_seasons_translations
		)
		return ret

	def to_season(
		self, season: dict[str, Any], *, language: str, show_id: str
	) -> Season:
		return Season(
			season_number=season["season_number"],
			start_air=datetime.strptime(season["air_date"], "%Y-%m-%d").date()
			if season["air_date"]
			else None,
			end_air=None,
			external_id={
				self.name: MetadataID(
					season["id"],
					f"https://www.themoviedb.org/tv/{show_id}/season/{season['season_number']}",
				)
			},
			translations={
				language: SeasonTranslation(
					name=season["name"],
					overview=season["overview"],
					posters=[
						f"https://image.tmdb.org/t/p/original{season['poster_path']}"
					]
					if season["poster_path"] is not None
					else [],
					thumbnails=[],
				)
			},
		)

	async def identify_episode(
		self,
		name: str,
		season: Optional[int],
		episode_nbr: Optional[int],
		absolute: Optional[int],
		year: Optional[int],
		*,
		language: list[str],
	) -> Episode:
		search_results = (
			await self.get("search/tv", params={"query": name, "year": year})
		)["results"]
		if len(search_results) == 0:
			raise ProviderError(f"No result for a tv show named: {name}")
		search = self.get_best_result(search_results, name, year)
		show_id = search["id"]
		if search["original_language"] not in language:
			language.append(search["original_language"])

		if season is None:
			season = await self._xem.get_season_override("tvdb", tvdbid, name)

		if not show_id in self.absolute_episode_cache:
			await self.get_absolute_order(show_id)

		if (
			absolute is not None
			and (season is None or episode_nbr is None)
			and show_id in self.absolute_episode_cache
			and self.absolute_episode_cache[show_id] is not None
			# Using absolute - 1 since the array is 0based (absolute episode 1 is at index 0)
			and len(self.absolute_episode_cache[show_id]) >= absolute
		):
			season = self.absolute_episode_cache[show_id][absolute - 1]["season_number"]
			episode_nbr = self.absolute_episode_cache[show_id][absolute - 1][
				"episode_number"
			]

		if season is None or episode_nbr is None:
			# Some shows don't have absolute numbering because the default one is absolute on tmdb (for example detetive conan)
			season = 1
			episode_nbr = absolute

		if (
			absolute is None
			and show_id in self.absolute_episode_cache
			and self.absolute_episode_cache[show_id]
		):
			absolute = next(
				(
					# The + 1 is to go from 0based index to 1based absolute number
					i + 1
					for i, x in enumerate(self.absolute_episode_cache[show_id])
					if x["episode_number"] == episode_nbr
					and x["season_number"] == season
				),
				None,
			)

		async def for_language(lng: str) -> Episode:
			episode = await self.get(
				f"tv/{show_id}/season/{season}/episode/{episode_nbr}",
				params={
					"language": lng,
				},
				not_found_fail=f"Could not find episode {episode_nbr} of season {season} of serie {search['name']}",
			)
			logging.debug("TMDb responded: %s", episode)

			ret = Episode(
				show=PartialShow(
					name=search["name"],
					original_language=search["original_language"],
					external_id={
						self.name: MetadataID(
							show_id, f"https://www.themoviedb.org/tv/{show_id}"
						)
					},
				),
				season_number=episode["season_number"],
				episode_number=episode["episode_number"],
				absolute_number=absolute,
				runtime=int(episode["runtime"]),
				release_date=datetime.strptime(episode["air_date"], "%Y-%m-%d").date()
				if episode["air_date"]
				else None,
				thumbnail=f"https://image.tmdb.org/t/p/original{episode['still_path']}"
				if "still_path" in episode and episode["still_path"] is not None
				else None,
				external_id={
					self.name: MetadataID(
						episode["id"],
						f"https://www.themoviedb.org/tv/{show_id}/season/{episode['season_number']}/episode/{episode['episode_number']}",
					),
				},
			)
			translation = EpisodeTranslation(
				name=episode["name"],
				overview=episode["overview"],
			)
			ret.translations = {lng: translation}
			return ret

		return await self.process_translations(for_language, language)

	def get_best_result(
		self, search_results: List[Any], name: str, year: Optional[int]
	) -> Any:
		results = search_results

		# Find perfect match by year since sometime tmdb decides to discard the year parameter.
		if year:
			results = list(
				x
				for x in search_results
				if ("first_air_date" in x and x["first_air_date"].startswith(str(year)))
				or ("release_date" in x and x["release_date"].startswith(str(year)))
			)
			if not results:
				results = search_results

		# If there is a perfect match use it (and if there are multiple, use the most popular one)
		res = sorted(
			(
				x
				for x in results
				if ("name" in x and x["name"] == name)
				or ("title" in x and x["title"] == name)
			),
			key=lambda x: x["popularity"],
			reverse=True,
		)
		if res:
			results = res
		else:
			# Ignore totally unpopular shows or unknown ones.
			# sorted is stable and False<True so doing this puts baddly rated items at the end of the list.
			results = sorted(
				results, key=lambda x: x["vote_count"] < 10 or x["popularity"] < 5
			)

		return results[0]

	async def get_absolute_order(self, show_id: str):
		try:
			groups = await self.get(f"tv/{show_id}/episode_groups")
			ep_count = max((x["episode_count"] for x in groups["results"]), default=0)
			# Filter only absolute groups that contains at least 75% of all episodes (to skip non maintained absolute ordering)
			group_id = next(
				(
					x["id"]
					for x in groups["results"]
					if x["type"] == 2 and x["episode_count"] >= ep_count // 1.5
				),
				None,
			)

			if group_id is None:
				self.absolute_episode_cache[show_id] = None
				return
			group = await self.get(f"tv/episode_group/{group_id}")
			grp = next(iter(group["groups"]), None)
			self.absolute_episode_cache[show_id] = grp["episodes"] if grp else None
		except Exception as e:
			logging.exception(
				"Could not retrieve absolute ordering information", exc_info=e
			)

	async def identify_collection(
		self, provider_id: str, *, language: list[str]
	) -> Collection:
		async def for_language(lng: str) -> Collection:
			collection = await self.get(
				f"collection/{provider_id}",
				params={
					"language": lng,
				},
			)
			logging.debug("TMDb responded: %s", collection)

			ret = Collection(
				external_id={
					self.name: MetadataID(
						collection["id"],
						f"https://www.themoviedb.org/collection/{collection['id']}",
					)
				},
			)
			translation = CollectionTranslation(
				name=collection["name"],
				overview=collection["overview"],
				posters=[
					f"https://image.tmdb.org/t/p/original{collection['poster_path']}"
				],
				logos=[],
				thumbnails=[
					f"https://image.tmdb.org/t/p/original{collection['backdrop_path']}"
				],
			)
			ret.translations = {lng: translation}
			return ret

		return await self.process_translations(for_language, language)
