import asyncio
from aiohttp import ClientSession
from datetime import date, timedelta
from logging import getLogger
from typing import Optional

from providers.utils import ProviderError
from matcher.cache import cache

from ..provider import Provider
from ..types.movie import Movie, MovieTranslation, Status as MovieStatus
from ..types.season import Season, SeasonTranslation
from ..types.episode import Episode, EpisodeTranslation, EpisodeID
from ..types.studio import Studio
from ..types.genre import Genre
from ..types.metadataid import MetadataID
from ..types.show import Show, ShowTranslation, Status as ShowStatus
from ..types.collection import Collection, CollectionTranslation

logger = getLogger(__name__)


class AniList(Provider):
	def __init__(
		self,
		client: ClientSession,
	) -> None:
		super().__init__()
		self._client = client
		self.base = "https://graphql.anilist.co"
		self._genre_map = {
			"Action": Genre.ACTION,
			"Adventure": Genre.ADVENTURE,
			"Comedy": Genre.COMEDY,
			"Drama": Genre.DRAMA,
			"Ecchi": None,
			"Fantasy": Genre.FANTASY,
			"Hentai": None,
			"Horror": Genre.HORROR,
			"Mahou Shoujo": None,
			"Mecha": None,
			"Music": Genre.MUSIC,
			"Mystery": Genre.MYSTERY,
			"Psychological": None,
			"Romance": Genre.ROMANCE,
			"Sci-Fi": Genre.SCIENCE_FICTION,
			"Slice of Life": None,
			"Sports": None,
			"Supernatural": None,
			"Thriller": Genre.THRILLER,
		}

	@property
	def name(self) -> str:
		return "anilist"

	async def get(self, query: str, not_found: str, **variables: Optional[str | int]):
		while True:
			async with self._client.post(
				self.base,
				json={
					"query": query,
					"variables": {
						k: v for (k, v) in variables.items() if v is not None
					},
				},
			) as r:
				if r.status == 404:
					raise ProviderError(not_found)
				if r.status == 429:
					await asyncio.sleep(float(r.headers["Retry-After"]))
					continue
				ret = await r.json()
				logger.error(ret)
				r.raise_for_status()
				if "errors" in ret:
					logger.error(ret)
					raise Exception(ret["errors"])
				return ret["data"]

	@cache(ttl=timedelta(days=1))
	async def query_anime(
		self,
		*,
		id: Optional[str] = None,
		search: Optional[str] = None,
		year: Optional[int] = None,
	) -> Show:
		query = """
		query SearchAnime($id: Int, $search: String, $year: Int) {
		  Media(id: $id, search: $search, type: ANIME, format_not: MOVIE, seasonYear: $year) {
		    id
			siteUrl
		    idMal
		    title {
		      romaji
		      english
		      native
		    }
		    description(asHtml: false)
			status
			episodes
		    startDate {
		      year
		      month
		      day
		    }
		    endDate {
		      year
		      month
		      day
		    }
		    countryOfOrigin
		    trailer {
		      id
		      site
		    }
		    coverImage {
		      extraLarge
		    }
		    bannerImage
		    genres
		    synonyms
		    averageScore
		    tags {
		      name
		      isMediaSpoiler
		      isGeneralSpoiler
		    }
		    studios(isMain: true) {
		      nodes {
		        id
		        name
		        siteUrl
		      }
		    }
		    relations {
		      edges {
		        id
		        relationType
		        node {
		          id
		          title {
		            romaji
		            english
		            native
		          }
		        }
		      }
		    }
		  }
		}
		"""
		q = await self.get(
			query,
			id=id,
			search=search,
			year=year,
			not_found=f"Could not find the show {id or ''}{search or ''}",
		)
		ret = q["Media"]
		show = Show(
			translations={
				"en": ShowTranslation(
					name=ret["title"]["romaji"],
					tagline=None,
					# TODO: unmarkdown the desc
					overview=ret["description"],
					# TODO: add spoiler tags
					tags=[
						x["name"]
						for x in ret["tags"]
						if not x["isMediaSpoiler"] and not x["isGeneralSpoiler"]
					]
					+ [
						x
						for x in ret["genres"]
						if x not in self._genre_map or self._genre_map[x] is None
					],
					posters=[ret["coverImage"]["extraLarge"]],
					logos=[],
					thumbnails=[],
					trailers=[f"https://youtube.com/watch?q={ret['trailer']['id']}"]
					if ret["trailer"] is not None
					and ret["trailer"]["site"] == "youtube"
					else [],
				)
			},
			original_language=ret["countryOfOrigin"],
			aliases=[ret["title"]["english"], ret["title"]["native"]],
			start_air=date(
				year=ret["startDate"]["year"],
				month=ret["startDate"]["month"],
				day=ret["startDate"]["day"],
			),
			end_air=date(
				year=ret["endDate"]["year"],
				month=ret["endDate"]["month"],
				day=ret["endDate"]["day"],
			)
			if ret["endDate"]["year"] is not None
			else None,
			status=ShowStatus.FINISHED
			if ret["status"] == "FINISHED"
			else ShowStatus.AIRING,
			rating=ret["averageScore"],
			genres=[self._genre_map[x] for x in ret["genres"] if x in self._genre_map],
			studios=[
				Studio(
					name=x["name"],
					external_id={
						self.name: MetadataID(x["id"], x["siteUrl"]),
					},
				)
				for x in ret["studios"]["nodes"]
			],
			external_id={
				self.name: MetadataID(ret["id"], ret["siteUrl"]),
				"mal": MetadataID(
					ret["idMal"], f"https://myanimelist.net/anime/{ret['idMal']}"
				),
				# TODO: add anidb id (needed for xem lookup and scrubbing)
			},
			seasons=[],
		)
		show.seasons.append(
			Season(
				# TODO: fill this approprietly
				season_number=1,
				episodes_count=ret["episodes"],
				start_air=show.start_air,
				end_air=show.end_air,
				external_id=show.external_id,
				translations={
					"en": SeasonTranslation(
						name=show.translations["en"].name,
						overview=show.translations["en"].overview,
						posters=show.translations["en"].posters,
						thumbnails=[],
					)
				},
			)
		)
		return show

	@cache(ttl=timedelta(days=1))
	async def query_movie(
		self,
		*,
		id: Optional[str] = None,
		search: Optional[str] = None,
		year: Optional[int] = None,
	) -> Movie:
		query = """
		query SearchMovie($id: Int, $search: String, $year: Int) {
		  Media(id: $id, search: $search, type: ANIME, format: MOVIE, seasonYear: $year) {
		    id
			siteUrl
		    idMal
		    title {
		      romaji
		      english
		      native
		    }
		    description(asHtml: false)
			status
		    startDate {
		      year
		      month
		      day
		    }
		    countryOfOrigin
		    trailer {
		      id
		      site
		    }
		    coverImage {
		      extraLarge
		    }
		    bannerImage
		    genres
		    synonyms
		    averageScore
		    tags {
		      name
		      isMediaSpoiler
		      isGeneralSpoiler
		    }
		    studios(isMain: true) {
		      nodes {
		        id
		        name
		        siteUrl
		      }
		    }
		  }
		}
		"""
		q = await self.get(
			query,
			id=id,
			search=search,
			year=year,
			not_found=f"No movie found for {id or ''}{search or ''}",
		)
		ret = q["Media"]
		return Movie(
			translations={
				"en": MovieTranslation(
					name=ret["title"]["romaji"],
					tagline=None,
					# TODO: unmarkdown the desc
					overview=ret["description"],
					# TODO: add spoiler tags
					tags=[
						x["name"]
						for x in ret["tags"]
						if not x["isMediaSpoiler"] and not x["isGeneralSpoiler"]
					]
					+ [
						x
						for x in ret["genres"]
						if x not in self._genre_map or self._genre_map[x] is None
					],
					posters=[ret["coverImage"]["extraLarge"]],
					logos=[],
					thumbnails=[],
					trailers=[f"https://youtube.com/watch?q={ret['trailer']['id']}"]
					if ret["trailer"] is not None
					and ret["trailer"]["site"] == "youtube"
					else [],
				)
			},
			original_language=ret["countryOfOrigin"],
			aliases=[ret["title"]["english"], ret["title"]["native"]],
			air_date=date(
				year=ret["startDate"]["year"],
				month=ret["startDate"]["month"],
				day=ret["startDate"]["day"],
			),
			status=MovieStatus.FINISHED
			if ret["status"] == "FINISHED"
			else MovieStatus.PLANNED,
			rating=ret["averageScore"],
			runtime=ret["runtime"],
			genres=[self._genre_map[x] for x in ret["genres"] if x in self._genre_map],
			studios=[
				Studio(
					name=x["name"],
					external_id={
						self.name: MetadataID(x["id"], x["siteUrl"]),
					},
				)
				for x in ret["studios"]["nodes"]
			],
			external_id={
				self.name: MetadataID(ret["id"], ret["siteUrl"]),
				"mal": MetadataID(
					ret["idMal"], f"https://myanimelist.net/anime/{ret['idMal']}"
				),
				# TODO: add anidb id (needed for xem lookup and scrubbing)
			},
		)

	async def search_movie(self, name: str, year: Optional[int]) -> Movie:
		return await self.query_movie(search=name, year=year)

	async def search_episode(
		self,
		name: str,
		season: Optional[int],
		episode_nbr: Optional[int],
		absolute: Optional[int],
		year: Optional[int],
	) -> Episode:
		absolute = absolute or episode_nbr
		if absolute is None:
			raise ProviderError(
				f"Could not guess episode number of the episode {name} {season}-{episode_nbr} ({absolute})"
			)

		show = await self.query_anime(search=name, year=year)

		return Episode(
			show=show,
			season_number=1,
			episode_number=absolute,
			absolute_number=absolute,
			runtime=None,
			release_date=None,
			thumbnail=None,
			external_id={
				self.name: EpisodeID(
					show.external_id[self.name].data_id, None, absolute, None
				),
				"mal": EpisodeID(show.external_id["mal"].data_id, None, absolute, None),
			},
		)

	async def identify_movie(self, movie_id: str) -> Movie:
		return await self.query_movie(id=movie_id)

	async def identify_show(self, show_id: str) -> Show:
		return await self.query_anime(id=show_id)

	async def identify_season(self, show_id: str, season: int) -> Season:
		show = await self.query_anime(id=show_id)
		return next((x for x in show.seasons if x.season_number == season))

	async def identify_episode(
		self, show_id: str, season: Optional[int], episode_nbr: int, absolute: int
	) -> Episode:
		raise NotImplementedError

	async def identify_collection(self, provider_id: str) -> Collection:
		raise NotImplementedError
