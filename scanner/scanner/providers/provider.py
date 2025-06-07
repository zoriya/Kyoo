from abc import ABC, abstractmethod
from logging import getLogger

from langcodes import Language

from ..models.movie import Movie, SearchMovie
from ..models.serie import SearchSerie, Serie

logger = getLogger(__name__)


class Provider(ABC):
	@property
	@abstractmethod
	def name(self) -> str:
		raise NotImplementedError

	@abstractmethod
	async def search_movies(
		self, title: str, year: int | None, *, language: list[Language]
	) -> list[SearchMovie]:
		raise NotImplementedError

	@abstractmethod
	async def search_series(
		self, title: str, year: int | None, *, language: list[Language]
	) -> list[SearchSerie]:
		raise NotImplementedError

	@abstractmethod
	async def get_movie(self, external_id: dict[str, str]) -> Movie | None:
		raise NotImplementedError

	@abstractmethod
	async def get_serie(self, external_id: dict[str, str]) -> Serie | None:
		raise NotImplementedError

	async def find_movie(
		self,
		title: str,
		year: int | None,
		external_id: dict[str, str],
	) -> Movie:
		ret = await self.get_movie(external_id)
		if ret is not None:
			return ret
		search = await self.search_movies(title, year, language=[])
		if not any(search):
			raise ProviderError(
				f"Couldn't find a movie with title {title}. (year: {year}"
			)
		ret = await self.get_movie(
			{k: v.data_id for k, v in search[0].external_id.items()}
		)
		if not ret:
			raise ValueError()
		return ret

	async def find_serie(
		self,
		title: str,
		year: int | None,
		external_id: dict[str, str],
	) -> Serie:
		ret = await self.get_serie(external_id)
		if ret is not None:
			return ret
		search = await self.search_series(title, year, language=[])
		if not any(search):
			raise ProviderError(
				f"Couldn't find a serie with title {title}. (year: {year}"
			)
		ret = await self.get_serie(
			{k: v.data_id for k, v in search[0].external_id.items()}
		)
		if not ret:
			raise ValueError()
		return ret


class ProviderError(RuntimeError):
	def __init__(self, *args: object) -> None:
		super().__init__(*args)
