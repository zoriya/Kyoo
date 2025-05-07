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


class ProviderError(RuntimeError):
	def __init__(self, *args: object) -> None:
		super().__init__(*args)
