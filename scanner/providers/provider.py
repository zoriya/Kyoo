import os
from aiohttp import ClientSession
from abc import abstractmethod
from typing import Optional, TypeVar

from .types.movie import Movie


Self = TypeVar("Self", bound="Provider")


class Provider:
	@classmethod
	def get_all(cls: type[Self], client: ClientSession) -> list[Self]:
		from providers.implementations.themoviedatabase import TheMovieDatabase
		providers = []

		tmdb = os.environ.get("THEMOVIEDB_APIKEY")
		if tmdb:
			providers.append(TheMovieDatabase(client, tmdb))

		return providers

	@abstractmethod
	async def identify_movie(
		self, name: str, year: Optional[int], *, language: list[str]
	) -> Movie:
		raise NotImplementedError
