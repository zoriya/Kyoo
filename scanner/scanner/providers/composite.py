from typing import override

from langcodes import Language

from ..models.movie import Movie, SearchMovie
from ..models.serie import SearchSerie, Serie
from .provider import Provider


class CompositeProvider(Provider):
	def __init__(self, themoviedb: Provider):
		self._tvdb: Provider = None  # type: ignore
		self._themoviedb = themoviedb

	@property
	@override
	def name(self):
		return "composite"

	@override
	async def search_movies(
		self, title: str, year: int | None, *, language: list[Language]
	) -> list[SearchMovie]:
		return await self._themoviedb.search_movies(title, year, language=language)

	@override
	async def get_movie(self, external_id: dict[str, str]) -> Movie | None:
		return await self._themoviedb.get_movie(external_id)

	@override
	async def search_series(
		self, title: str, year: int | None, *, language: list[Language]
	) -> list[SearchSerie]:
		return await self._tvdb.search_series(title, year, language=language)

	@override
	async def get_serie(self, external_id: dict[str, str]) -> Serie | None:
		ret = await self._tvdb.get_serie(external_id)
		if ret is None:
			return None
		# TODO: complete metadata with info from tmdb
		return ret
