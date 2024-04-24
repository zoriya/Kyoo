import asyncio
from aiohttp import ClientSession
from datetime import date
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


class AniList(Provider):
	def __init__(
		self,
		languages: list[str],
		client: ClientSession,
		api_key: str,
	) -> None:
		super().__init__()
		self._languages = languages
		self._client = client
		self.base = "https://graphql.anilist.co"
		self.api_key = api_key

	@property
	def name(self) -> str:
		return "anilist"

	async def get(self, query: str, **variables: Optional[str]):
		async with self._client.post(
			self.base, json={"query": query, "variables": variables}
		) as r:
			r.raise_for_status()
			return await r.json()

	async def queryAnime(self, id: Optional[str], search: Optional[str]) -> Show:
		query = """
		{
		  Media(id: $id, search: $search, type: ANIME) {
		    id
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
		ret = await self.get(query, id=id, search=search)
		return Show(
			translations={
				"en": ShowTranslation(
					name=ret["titles"]["romaji"],
					tagline=None,
					# TODO: unmarkdown the desc
					overview=ret["description"],
					# TODO: add spoiler tags
					tags=[
						x["name"]
						for x in ret["tags"]
						if not x["isMediaSpoiler"] and not x["isGeneralSpoiler"]
					],
					posters=[ret["coverImage"]["extraLarge"]],
					logos=[],
					thumbnails=[],
					trailers=[f"https://youtube.com/watch?q={ret['trailer']['id']}"]
					if ret["trailer"]["site"] == "youtube"
					else [],
				)
			},
			original_language=ret["countryOfOrigin"],
			aliases=[ret["titles"]["english"], ret["titles"]["native"]],
			start_air=date(
				year=ret["startDate"]["year"],
				month=ret["startDate"]["month"],
				day=ret["startDate"]["day"],
			),
			end_air=date(
				year=ret["endDate"]["year"],
				month=ret["endDate"]["month"],
				day=ret["endDate"]["day"],
			),
			status=ShowStatus.FINISHED
			if ret["status"] == "FINISHED"
			else ShowStatus.AIRING,
			rating=ret["averageScore"],
			# TODO: fill that
			studios=[],
			genres=[],
			external_id={},
			seasons=[],
		)
