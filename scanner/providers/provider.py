import os
from aiohttp import ClientSession
from abc import abstractmethod, abstractproperty
from typing import Optional

from providers.implementations.thexem import TheXem
from providers.utils import ProviderError

from .types.show import Show
from .types.season import Season
from .types.episode import Episode
from .types.movie import Movie
from .types.collection import Collection


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

		tmdb = os.environ.get("THEMOVIEDB_APIKEY")
		if tmdb:
			tmdb = TheMovieDatabase(languages, client, tmdb)
			providers.append(tmdb)

		if not any(providers):
			raise ProviderError(
				"No provider configured. You probably forgot to specify an API Key"
			)

		provider = next(iter(providers))
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
	async def identify_episode(self, show_id: str, season: Optional[int], episode_nbr: int, absolute: int) -> Episode:
		raise NotImplementedError

	@abstractmethod
	async def identify_collection(self, provider_id: str) -> Collection:
		raise NotImplementedError

	@abstractmethod
	async def get_expected_titles(self) -> list[str]:
		return []
