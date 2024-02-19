import os
from aiohttp import ClientSession
from abc import abstractmethod, abstractproperty
from typing import Optional, TypeVar

from providers.implementations.thexem import TheXem
from providers.utils import ProviderError

from .types.show import Show
from .types.season import Season
from .types.episode import Episode
from .types.movie import Movie
from .types.collection import Collection


Self = TypeVar("Self", bound="Provider")


class Provider:
	@classmethod
	def get_all(
		cls: type[Self], client: ClientSession, languages: list[str]
	) -> tuple[list[Self], TheXem]:
		providers = []

		from providers.idmapper import IdMapper

		idmapper = IdMapper()
		xem = TheXem(client)

		from providers.implementations.themoviedatabase import TheMovieDatabase

		tmdb = os.environ.get("THEMOVIEDB_APIKEY")
		if tmdb:
			tmdb = TheMovieDatabase(languages, client, tmdb, xem, idmapper)
			providers.append(tmdb)
		else:
			tmdb = None

		if not any(providers):
			raise ProviderError(
				"No provider configured. You probably forgot to specify an API Key"
			)

		idmapper.init(tmdb=tmdb, language=languages[0])

		return providers, xem

	@abstractproperty
	def name(self) -> str:
		raise NotImplementedError

	@abstractmethod
	async def identify_movie(self, name: str, year: Optional[int]) -> Movie:
		raise NotImplementedError

	@abstractmethod
	async def identify_show(self, show_id: str) -> Show:
		raise NotImplementedError

	@abstractmethod
	async def identify_season(self, show_id: str, season_number: int) -> Season:
		raise NotImplementedError

	@abstractmethod
	async def identify_episode(
		self,
		name: str,
		season: Optional[int],
		episode_nbr: Optional[int],
		absolute: Optional[int],
		year: Optional[int],
	) -> Episode:
		raise NotImplementedError

	@abstractmethod
	async def identify_collection(self, provider_id: str) -> Collection:
		raise NotImplementedError
