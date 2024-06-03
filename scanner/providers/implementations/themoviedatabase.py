import asyncio
from aiohttp import ClientSession
from datetime import datetime, timedelta
from logging import getLogger
from typing import Awaitable, Callable, Dict, List, Optional, Any, TypeVar
from itertools import accumulate, zip_longest

from providers.utils import ProviderError
from matcher.cache import cache

from ..provider import Provider
from ..types.movie import Movie, MovieTranslation, Status as MovieStatus
from ..types.season import Season, SeasonTranslation
from ..types.episode import Episode, EpisodeTranslation, PartialShow, EpisodeID
from ..types.studio import Studio
from ..types.genre import Genre
from ..types.metadataid import MetadataID
from ..types.show import Show, ShowTranslation, Status as ShowStatus
from ..types.collection import Collection, CollectionTranslation

logger = getLogger(__name__)


class TheMovieDatabase(Provider):
	DEFAULT_API_KEY = "c9f328a01011b28f22483717395fc3fa"

	def __init__(
		self,
		languages: list[str],
		client: ClientSession,
		api_key: str,
	) -> None:
		super().__init__()
		self._languages = languages
		self._client = client
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
			10759: [Genre.ACTION, Genre.ADVENTURE],
			10762: Genre.KIDS,
			10763: Genre.NEWS,
			10764: Genre.REALITY,
			10765: [Genre.SCIENCE_FICTION, Genre.FANTASY],
			10766: Genre.SOAP,
			10767: Genre.TALK,
			10768: [Genre.WAR, Genre.POLITICS],
		}

	@property
	def name(self) -> str:
		return "themoviedatabase"

	def process_genres(self, genres) -> list[Genre]:
		def flatten(x: Genre | list[Genre]) -> list[Genre]:
			if isinstance(x, list):
				return [j for i in x for j in flatten(i)]
			return [x]

		return flatten(
			[self.genre_map[x["id"]] for x in genres if x["id"] in self.genre_map]
		)

	def get_languages(self, *args):
		return self._languages + list(args)

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

	async def search_movie(self, name: str, year: Optional[int]) -> Movie:
		search_results = (
			await self.get("search/movie", params={"query": name, "year": year})
		)["results"]
		if len(search_results) == 0:
			raise ProviderError(f"No result for a movie named: {name}")
		search = self.get_best_result(search_results, name, year)
		return await self.identify_movie(search["id"])

	async def identify_movie(self, movie_id: str) -> Movie:
		languages = self.get_languages()

		async def for_language(lng: str) -> Movie:
			movie = await self.get(
				f"movie/{movie_id}",
				params={
					"language": lng,
					"append_to_response": "alternative_titles,videos,credits,keywords,images",
				},
			)
			logger.debug("TMDb responded: %s", movie)

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
				runtime=int(movie["runtime"]) if movie["runtime"] is not None else None,
				studios=[self.to_studio(x) for x in movie["production_companies"]],
				genres=self.process_genres(movie["genres"]),
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
						if lng == movie["original_language"]
						else []
					)
				),
				logos=self.get_image(movie["images"]["logos"]),
				thumbnails=self.get_image(
					movie["images"]["backdrops"]
					+ (
						[{"file_path": movie["backdrop_path"]}]
						if lng == movie["original_language"]
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

		ret = await self.process_translations(for_language, languages)
		if (
			ret.original_language is not None
			and ret.original_language not in ret.translations
		):
			ret.translations[ret.original_language] = (
				await for_language(ret.original_language)
			).translations[ret.original_language]
		return ret

	@cache(ttl=timedelta(days=1))
	async def identify_show(
		self,
		show_id: str,
	) -> Show:
		languages = self.get_languages()

		async def for_language(lng: str) -> Show:
			show = await self.get(
				f"tv/{show_id}",
				params={
					"language": lng,
					"append_to_response": "alternative_titles,videos,credits,keywords,images,external_ids",
				},
			)
			logger.debug("TMDb responded: %s", show)

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
				genres=self.process_genres(show["genres"]),
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
						if lng == show["original_language"]
						else []
					)
				),
				logos=self.get_image(show["images"]["logos"]),
				thumbnails=self.get_image(
					show["images"]["backdrops"]
					+ (
						[{"file_path": show["backdrop_path"]}]
						if lng == show["original_language"]
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
					languages=languages,
				)
				for season in item.seasons
			]
			return item

		ret = await self.process_translations(
			for_language, languages, merge_seasons_translations
		)
		if (
			ret.original_language is not None
			and ret.original_language not in ret.translations
		):
			ret.translations[ret.original_language] = (
				await for_language(ret.original_language)
			).translations[ret.original_language]
		return ret

	def to_season(
		self, season: dict[str, Any], *, language: str, show_id: str
	) -> Season:
		return Season(
			season_number=season["season_number"],
			episodes_count=season["episode_count"],
			start_air=datetime.strptime(season["air_date"], "%Y-%m-%d").date()
			if season["air_date"]
			else None,
			end_air=None,
			external_id={
				self.name: MetadataID(
					show_id,
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

	async def identify_season(self, show_id: str, season: int) -> Season:
		# We already get seasons info in the identify_show and chances are this gets cached already
		show = await self.identify_show(show_id)
		ret = next((x for x in show.seasons if x.season_number == season), None)
		if ret is None:
			raise ProviderError(
				f"Could not find season {season} for show {show.to_kyoo()['name']}"
			)
		return ret

	@cache(ttl=timedelta(days=1))
	async def search_show(self, name: str, year: Optional[int]) -> PartialShow:
		search_results = (
			await self.get("search/tv", params={"query": name, "year": year})
		)["results"]

		if len(search_results) == 0:
			raise ProviderError(f"No result for a tv show named: {name}")

		search = self.get_best_result(search_results, name, year)
		show_id = search["id"]
		return PartialShow(
			name=search["name"],
			original_language=search["original_language"],
			external_id={
				self.name: MetadataID(
					show_id, f"https://www.themoviedb.org/tv/{show_id}"
				)
			},
		)

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

		if absolute is not None and (season is None or episode_nbr is None):
			(season, episode_nbr) = await self.get_episode_from_absolute(
				show_id, absolute
			)

		if season is None or episode_nbr is None:
			raise ProviderError(
				f"Could not guess season or episode number of the episode {show.name} {season}-{episode_nbr} ({absolute})",
			)

		if absolute is None:
			absolute = await self.get_absolute_number(show_id, season, episode_nbr)
		return await self.identify_episode(show_id, season, episode_nbr, absolute)

	async def identify_episode(
		self, show_id: str, season: Optional[int], episode_nbr: int, absolute: int
	) -> Episode:
		async def for_language(lng: str) -> Episode:
			try:
				episode = await self.get(
					f"tv/{show_id}/season/{season}/episode/{episode_nbr}",
					params={
						"language": lng,
					},
				)
			except:
				episode = await self.get(
					f"tv/{show_id}/season/{season}/episode/{absolute}",
					params={
						"language": lng,
					},
					not_found_fail=f"Could not find episode {episode_nbr} of season {season} of serie {show_id} (absolute: {absolute})",
				)
			logger.debug("TMDb responded: %s", episode)

			ret = Episode(
				show=PartialShow(
					name=show_id,
					original_language=None,
					external_id={
						self.name: MetadataID(
							show_id, f"https://www.themoviedb.org/tv/{show_id}"
						)
					},
				),
				season_number=episode["season_number"],
				episode_number=episode["episode_number"],
				absolute_number=absolute,
				runtime=int(episode["runtime"])
				if episode["runtime"] is not None
				else None,
				release_date=datetime.strptime(episode["air_date"], "%Y-%m-%d").date()
				if episode["air_date"]
				else None,
				thumbnail=f"https://image.tmdb.org/t/p/original{episode['still_path']}"
				if "still_path" in episode and episode["still_path"] is not None
				else None,
				external_id={
					self.name: EpisodeID(
						show_id,
						episode["season_number"],
						episode["episode_number"],
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

		return await self.process_translations(for_language, self.get_languages())

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

		return results[0]

	@cache(ttl=timedelta(days=1))
	async def get_absolute_order(self, show_id: str):
		"""
		TheMovieDb does not allow to fetch an episode by an absolute number but it
		support groups where you can list episodes. One type is the absolute group
		where everything should be on one season, this method tries to find a complete
		absolute-ordered group and return it
		"""

		show = await self.identify_show(show_id)
		try:
			groups = await self.get(f"tv/{show_id}/episode_groups")
			ep_count = max((x["episode_count"] for x in groups["results"]), default=0)
			if ep_count == 0:
				return None
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
				return None
			group = await self.get(f"tv/episode_group/{group_id}")
			absgrp = [
				ep
				for grp in sorted(group["groups"], key=lambda x: x["order"])
				# Some shows include specials as the first absolute group (like TenSura)
				if grp["name"] != "Specials"
				for ep in sorted(grp["episodes"], key=lambda x: x["order"])
			]
			season_starts = [
				next(
					(
						x["episode_number"]
						for x in absgrp
						if x["season_number"] == s.season_number
					),
					1,
				)
				for s in show.seasons
			]
			complete_abs = absgrp + [
				{"season_number": s.season_number, "episode_number": e}
				for s in show.seasons
				# ignore specials not specified in the absgrp
				if s.season_number > 0
				for e in range(1, s.episodes_count + 1)
				if not any(
					x["season_number"] == s.season_number
					and (
						x["episode_number"] == e
						# take into account weird absolute (for example one piece, episodes are not reset to 1 when the season starts)
						or x["episode_number"] == season_starts[s.season_number - 1] + e
					)
					for x in absgrp
				)
			]
			if len(complete_abs) != len(absgrp):
				logger.warn(
					f"Incomplete absolute group for show {show_id}. Filling missing values by assuming season/episode order is ascending"
				)
			return complete_abs
		except Exception as e:
			logger.exception(
				"Could not retrieve absolute ordering information", exc_info=e
			)
			return None

	async def get_episode_from_absolute(self, show_id: str, absolute: int):
		absgrp = await self.get_absolute_order(show_id)

		if absgrp is not None and len(absgrp) >= absolute:
			# Using absolute - 1 since the array is 0based (absolute episode 1 is at index 0)
			season = absgrp[absolute - 1]["season_number"]
			episode_nbr = absgrp[absolute - 1]["episode_number"]
			return (season, episode_nbr)
		# We assume that each season should be played in order with no special episodes.
		show = await self.identify_show(show_id)
		# Dont forget to ingore the special season (season_number 0)
		seasons_nbrs = [x.season_number for x in show.seasons if x.season_number != 0]
		seasons_eps = [x.episodes_count for x in show.seasons if x.season_number != 0]

		if not any(seasons_nbrs):
			return (None, None)

		# zip_longest(seasons_nbrs[1:], accumulate(seasons_eps)) return [(2, 12), (None, 24)] if the show has two seasons with 12 eps
		# we take the last group that has less total episodes than the absolute number.
		return next(
			(
				(snbr, absolute - ep_cnt)
				for snbr, ep_cnt in reversed(
					list(zip_longest(seasons_nbrs[1:], accumulate(seasons_eps)))
				)
				if ep_cnt < absolute
			),
			# If the absolute episode number is lower than the 1st season number of episode, it is part of it.
			(seasons_nbrs[0], absolute),
		)

	async def get_absolute_number(
		self, show_id: str, season: int, episode_nbr: int
	) -> int:
		absgrp = await self.get_absolute_order(show_id)
		if absgrp is None:
			# We assume that each season should be played in order with no special episodes.
			show = await self.identify_show(show_id)
			return (
				sum(
					x.episodes_count
					for x in show.seasons
					if 0 < x.season_number < season
				)
				+ episode_nbr
			)
		absolute = next(
			(
				# The + 1 is to go from 0based index to 1based absolute number
				i + 1
				for i, x in enumerate(absgrp)
				if x["episode_number"] == episode_nbr and x["season_number"] == season
			),
			None,
		)
		if absolute is not None:
			return absolute
		# assume we use tmdb weird absolute by default (for example, One Piece S21E800, the first
		# episode of S21 is not reset to 0 but keep increasing so it can be 800
		start = next(
			(x["episode_number"] for x in absgrp if x["season_number"] == season), None
		)
		if start is None or start <= episode_nbr:
			raise ProviderError(
				f"Could not guess absolute number of episode {show_id} s{season} e{episode_nbr}"
			)
		# add back the continuous number (imagine the user has one piece S21e31
		# but tmdb registered it as S21E831 since S21's first ep is 800
		return await self.get_absolute_number(show_id, season, episode_nbr + start)

	async def identify_collection(self, provider_id: str) -> Collection:
		languages = self.get_languages()

		async def for_language(lng: str) -> Collection:
			collection = await self.get(
				f"collection/{provider_id}",
				params={
					"language": lng,
				},
			)
			logger.debug("TMDb responded: %s", collection)

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

		return await self.process_translations(for_language, languages)
