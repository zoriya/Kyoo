from typing import override

from langcodes import Language

from scanner.models.metadataid import MetadataId

from ..models.movie import Movie, SearchMovie
from ..models.serie import SearchSerie, Serie
from .provider import Provider


class CompositeProvider(Provider):
	def __init__(self, tvdb: Provider, themoviedb: Provider):
		self._tvdb = tvdb
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
		ret = await self._themoviedb.get_movie(external_id)
		if ret is None:
			return None
		# we only use tvdb for collections, since tmdb doesn't have them for series
		info = await self._tvdb.get_movie(MetadataId.map_dict(ret.external_id))
		if info is None:
			return ret
		if info.collection is not None:
			ret.collection = info.collection
		ret.external_id = MetadataId.merge(ret.external_id, info.external_id)
		return ret

	@override
	async def search_series(
		self, title: str, year: int | None, *, language: list[Language]
	) -> list[SearchSerie]:
		return await self._tvdb.search_series(title, year, language=language)

	@override
	async def get_serie(
		self, external_id: dict[str, str], *, skip_entries=False
	) -> Serie | None:
		ret = await self._tvdb.get_serie(external_id)
		if ret is None:
			return None
		# themoviedb has better global info than tvdb but tvdb has better entries info
		info = await self._themoviedb.get_serie(
			MetadataId.map_dict(ret.external_id), skip_entries=True
		)
		if info is None:
			return ret
		info.seasons = ret.seasons
		info.entries = ret.entries
		info.extra = ret.extra
		if ret.collection is not None:
			info.collection = ret.collection
		info.external_id = MetadataId.merge(ret.external_id, info.external_id)
		return info
