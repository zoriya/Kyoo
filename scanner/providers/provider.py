from logging import getLogger
import os
from aiohttp import ClientSession
from abc import abstractmethod, abstractproperty
from typing import Optional

from providers.utils import ProviderError

from .types.show import Show
from .types.season import Season
from .types.episode import Episode
from .types.movie import Movie
from .types.collection import Collection

logger = getLogger(__name__)


class Provider:
	@classmethod
	def get_default(cls, client: ClientSession):
		languages = os.environ.get("LIBRARY_LANGUAGES")
		if not languages:
			print("Missing environment variable 'LIBRARY_LANGUAGES'.")
			exit(2)
		languages = languages.split(",")
		providers = []

		from providers.implementations.themoviedatabase import TheMovieDatabase

		tmdb = os.environ.get("THEMOVIEDB_APIKEY") or TheMovieDatabase.DEFAULT_API_KEY
		if tmdb != "disabled":
			tmdb = TheMovieDatabase(languages, client, tmdb)
			providers.append(tmdb)

		from providers.implementations.thetvdb import TVDB

		tvdb = os.environ.get("TVDB_APIKEY") or TVDB.DEFAULT_API_KEY
		if tvdb != "disabled":
			pin = os.environ.get("TVDB_PIN") or None
			tvdb = TVDB(client, tvdb, pin, languages)
			providers.append(tvdb)

		if not any(providers):
			raise ProviderError(
				"No provider configured. You probably forgot to specify an API Key"
			)

		from providers.implementations.thexem import TheXem

		provider = next(iter(providers))
		logger.info(f"Starting with provider: {provider.name}")
		return TheXem(client, provider)

	@abstractproperty
	def name(self) -> str:
		raise NotImplementedError

	@abstractmethod
	async def search_movie(self, name: str, year: Optional[int]) -> Movie:
		raise NotImplementedError

	@abstractmethod
	async def search_episode(
		self,
		name: str,
		season: Optional[int],
		episode_nbr: Optional[int],
		absolute: Optional[int],
		year: Optional[int],
	) -> Episode:
		raise NotImplementedError

	@abstractmethod
	async def identify_movie(self, movie_id: str) -> Movie:
		raise NotImplementedError

	@abstractmethod
	async def identify_show(self, show_id: str) -> Show:
		raise NotImplementedError

	@abstractmethod
	async def identify_season(self, show_id: str, season: int) -> Season:
		raise NotImplementedError

	@abstractmethod
	async def identify_episode(
		self, show_id: str, season: Optional[int], episode_nbr: int, absolute: int
	) -> Episode:
		raise NotImplementedError

	@abstractmethod
	async def identify_collection(self, provider_id: str) -> Collection:
		raise NotImplementedError

	@abstractmethod
	async def get_expected_titles(self) -> list[str]:
		return []
