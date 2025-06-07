import os
from logging import getLogger
from types import TracebackType
from typing import Literal

from aiohttp import ClientSession
from pydantic import TypeAdapter

from .models.movie import Movie
from .models.request import Request
from .models.serie import Serie
from .models.videos import For, Resource, Video, VideoCreated, VideoInfo, VideoLink
from .utils import Singleton

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
		async with self._client.post(
			"movies",
			data=movie.model_dump_json(by_alias=True),
		) as r:
			r.raise_for_status()
			return Resource.model_validate(await r.json())

	async def create_serie(self, serie: Serie) -> Resource:
		async with self._client.post(
			"series",
			data=serie.model_dump_json(by_alias=True),
		) as r:
			r.raise_for_status()
			return Resource.model_validate(await r.json())

	async def link_videos(
		self,
		kind: Literal["movie", "serie"],
		show: str,
		videos: list[Request.Video],
	):
		def map_request(request: Request.Video):
			if kind == "movie":
				return VideoLink(id=request.id, for_=[For.Movie(movie=show)])
			return VideoLink(
				id=request.id,
				for_=[
					For.Special(serie=show, special=ep.episode)
					if ep.season is None or ep.season == 0
					else For.Episode(serie=show, season=ep.season, episode=ep.episode)
					for ep in request.episodes
				],
			)

		async with self._client.post(
			"videos/link",
			data=TypeAdapter(list[VideoLink]).dump_json(
				[map_request(x) for x in videos],
				by_alias=True,
			),
		) as r:
			r.raise_for_status()
