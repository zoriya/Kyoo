from __future__ import annotations
from typing import TYPE_CHECKING

if TYPE_CHECKING:
	from providers.implementations.themoviedatabase import TheMovieDatabase

from typing import List, Optional
from providers.types.metadataid import MetadataID


class IdMapper:
	def init(self, *, language: str, tmdb: Optional[TheMovieDatabase]):
		self.language = language
		self._tmdb = tmdb

	async def get_show(
		self, show: dict[str, MetadataID], *, required: Optional[List[str]] = None
	):
		ids = show

		# Only fetch using tmdb if one of the required ids is not already known.
		should_fetch = required is not None and any((x not in ids for x in required))
		if self._tmdb and self._tmdb.name in ids and should_fetch:
			tmdb_info = await self._tmdb.identify_show(
				ids[self._tmdb.name].data_id,
				original_language=None,
				language=[self.language],
			)
			return {**ids, **tmdb_info.external_id}
		return ids

	async def get_movie(
		self, movie: dict[str, MetadataID], *, required: Optional[List[str]] = None
	):
		# TODO: actually do something here
		return movie
