import os
from logging import getLogger

from aiohttp import ClientSession

from .models.movie import Movie
from .models.serie import Serie
from .models.videos import Resource, Video, VideoCreated, VideoInfo

logger = getLogger(__name__)


class KyooClient:
	def __init__(self) -> None:
		api_key = os.environ.get("KYOO_APIKEY")
		if not api_key:
			print("Missing environment variable 'KYOO_APIKEY'.")
			exit(2)
		self._client = ClientSession(
			base_url=os.environ.get("KYOO_URL", "http://api:3567/api"),
			headers={
				"User-Agent": "kyoo scanner v5",
				"X-API-KEY": api_key,
			},
		)

	async def __aenter__(self):
		return self

	async def __aexit__(self):
		await self._client.close()

	async def get_videos_info(self) -> VideoInfo:
		async with self._client.get("/videos") as r:
			r.raise_for_status()
			return VideoInfo(**await r.json())

	async def create_videos(self, videos: list[Video]) -> list[VideoCreated]:
		async with self._client.post(
			"videos",
			json=[x.model_dump_json() for x in videos],
		) as r:
			r.raise_for_status()
			return list[VideoCreated](**await r.json())

	async def delete_videos(self, videos: list[str] | set[str]):
		async with self._client.delete(
			"videos",
			json=videos,
		) as r:
			r.raise_for_status()

	async def create_movie(self, movie: Movie) -> Resource:
		async with self._client.post(
			"movies",
			json=movie.model_dump_json(),
		) as r:
			r.raise_for_status()
			return Resource(**await r.json())

	async def create_serie(self, serie: Serie) -> Resource:
		async with self._client.post(
			"series",
			json=serie.model_dump_json(),
		) as r:
			r.raise_for_status()
			return Resource(**await r.json())
