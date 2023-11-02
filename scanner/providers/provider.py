import os
from aiohttp import ClientSession
from abc import abstractmethod, abstractproperty
from typing import Optional, TypeVar

from providers.utils import ProviderError

from .types.episode import Episode, PartialShow
from .types.show import Show
from .types.movie import Movie
from .types.collection import Collection


Self = TypeVar("Self", bound="Provider")


class Provider:
	@classmethod
	def get_all(cls: type[Self], client: ClientSession) -> list[Self]:
		from providers.implementations.themoviedatabase import TheMovieDatabase

		providers = []

		tmdb = os.environ.get("THEMOVIEDB_APIKEY")
		if tmdb:
			providers.append(TheMovieDatabase(client, tmdb))

		if not any(providers):
			raise ProviderError(
				"No provider configured. You probably forgot to specify an API Key"
			)

		return providers

	@abstractproperty
	def name(self) -> str:
		raise NotImplementedError

	@abstractmethod
	async def identify_movie(
		self, name: str, year: Optional[int], *, language: list[str]
	) -> Movie:
		raise NotImplementedError

	@abstractmethod
	async def identify_show(self, show: PartialShow, *, language: list[str]) -> Show:
		raise NotImplementedError

	@abstractmethod
	async def identify_episode(
		self,
		name: str,
		season: Optional[int],
		episode_nbr: Optional[int],
		absolute: Optional[int],
		year: Optional[int],
		*,
		language: list[str]
	) -> Episode:
		raise NotImplementedError

	@abstractmethod
	async def identify_collection(
		self, provider_id: str, *, language: list[str]
	) -> Collection:
		raise NotImplementedError
