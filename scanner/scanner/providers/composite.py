from typing import override

from langcodes import Language

from ..models.movie import Movie, SearchMovie
from ..models.serie import SearchSerie, Serie
from .provider import Provider, ProviderError


class CompositeProvider(Provider):
	def __init__(self):
		self._tvdb: Provider = None  # type: ignore
		self._themoviedb: Provider = None  # type: ignore

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

	async def find_movie(
		self, title: str, year: int | None, external_id: dict[str, str]
	) -> Movie:
		ret = await self.get_movie(external_id)
		if ret is not None:
			return ret
		search = await self.search_movies(title, year, language=[])
		if not any(search):
			raise ProviderError(
				f"Couldn't find a movie with title {title}. (year: {year}"
			)
		ret = await self.get_movie(search[0].external_id)
		if not ret:
			raise ValueError()
		return ret

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

	async def find_serie(
		self, title: str, year: int | None, external_id: dict[str, str]
	) -> Serie:
		ret = await self.get_serie(external_id)
		if ret is not None:
			return ret
		search = await self.search_series(title, year, language=[])
		if not any(search):
			raise ProviderError(
				f"Couldn't find a serie with title {title}. (year: {year}"
			)
		return await self.get_serie(search[0].external_id)
