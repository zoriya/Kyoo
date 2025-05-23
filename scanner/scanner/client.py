import os
from logging import getLogger
from types import TracebackType

from aiohttp import ClientSession
from pydantic import TypeAdapter

from scanner.utils import Singleton

from .models.movie import Movie
from .models.serie import Serie
from .models.videos import Resource, Video, VideoCreated, VideoInfo

logger = getLogger(__name__)


class KyooClient(metaclass=Singleton):
	def __init__(self) -> None:
		self._client = ClientSession(
			base_url=os.environ.get("KYOO_URL", "http://api:3567/api") + "/",
			headers={
				"User-Agent": "kyoo scanner v5",
				"Content-type": "application/json",
			},
		)
		if api_key := os.environ.get("KYOO_APIKEY"):
			self._client.headers["X-API-KEY"] = api_key

	async def __aenter__(self):
		return self

	async def __aexit__(
		self,
		exc_type: type[BaseException] | None,
		exc_value: BaseException | None,
		traceback: TracebackType | None,
	):
		await self._client.close()

	async def get_videos_info(self) -> VideoInfo:
		async with self._client.get("videos") as r:
			r.raise_for_status()
			return VideoInfo(**await r.json())

	async def create_videos(self, videos: list[Video]) -> list[VideoCreated]:
		async with self._client.post(
			"videos",
			data=TypeAdapter(list[Video]).dump_json(videos, by_alias=True),
		) as r:
			r.raise_for_status()
			return TypeAdapter(list[VideoCreated]).validate_json(await r.text())

	async def delete_videos(self, videos: list[str] | set[str]):
		async with self._client.delete(
			"videos",
			data=TypeAdapter(list[str] | set[str]).dump_json(videos, by_alias=True),
		) as r:
			r.raise_for_status()

	async def create_movie(self, movie: Movie) -> Resource:
		logger.debug("sending movie %s", movie.model_dump_json(by_alias=True))
		async with self._client.post(
			"movies",
			json=movie.model_dump_json(by_alias=True),
		) as r:
			r.raise_for_status()
			return Resource(**await r.json())

	async def create_serie(self, serie: Serie) -> Resource:
		logger.debug("sending serie %s", serie.model_dump_json(by_alias=True))
		async with self._client.post(
			"series",
			json=serie.model_dump_json(by_alias=True),
		) as r:
			r.raise_for_status()
			return Resource(**await r.json())
