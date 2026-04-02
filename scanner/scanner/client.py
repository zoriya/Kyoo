import os
from datetime import datetime, timezone
from logging import getLogger
from types import TracebackType
from typing import Literal

from aiohttp import ClientResponse, ClientResponseError, ClientSession
from pydantic import TypeAdapter

from .models.movie import Movie, MovieGet
from .models.page import Page
from .models.request import Request
from .models.serie import Serie
from .models.show import Show
from .models.videos import (
	For,
	Guess,
	Resource,
	Video,
	VideoCreated,
	VideoGet,
	VideoInfo,
	VideoLink,
)
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

	async def raise_for_status(self, r: ClientResponse):
		if r.status >= 400:
			raise ClientResponseError(
				r.request_info,
				r.history,
				status=r.status,
				message=await r.text(),
				headers=r.headers,
			)

	async def get_videos_info(self) -> VideoInfo:
		async with self._client.get("videos/guesses") as r:
			await self.raise_for_status(r)
			return VideoInfo(**await r.json())

	async def create_videos(self, videos: list[Video]) -> list[VideoCreated]:
		if len(videos) == 0:
			return []
		async with self._client.post(
			"videos",
			data=TypeAdapter(list[Video]).dump_json(videos, by_alias=True),
		) as r:
			await self.raise_for_status(r)
			return TypeAdapter(list[VideoCreated]).validate_json(await r.text())

	async def delete_videos(self, videos: list[str] | set[str]):
		async with self._client.delete(
			"videos",
			data=TypeAdapter(list[str] | set[str]).dump_json(videos, by_alias=True),
		) as r:
			await self.raise_for_status(r)

	async def create_movie(self, movie: Movie) -> Resource:
		async with self._client.post(
			"movies",
			data=movie.model_dump_json(by_alias=True),
		) as r:
			await self.raise_for_status(r)
			return Resource.model_validate(await r.json())

	async def create_serie(self, serie: Serie) -> Resource:
		async with self._client.post(
			"series",
			data=serie.model_dump_json(by_alias=True),
		) as r:
			await self.raise_for_status(r)
			return Resource.model_validate(await r.json())

	async def get_shows_to_refresh(self, next: str | None) -> Page[Show]:
		now = datetime.now(timezone.utc).date()
		async with self._client.get(
			next or f"shows?sort=nextRefresh&filter=nextRefresh le {now}"
		) as r:
			await self.raise_for_status(r)
			return Page[Show].model_validate(await r.json())

	async def get_movie(self, slug: str) -> Show:
		async with self._client.get(f"movies/{slug}") as r:
			await self.raise_for_status(r)
			return Show.model_validate(await r.json())

	async def get_serie(self, slug: str) -> Show:
		async with self._client.get(f"series/{slug}") as r:
			await self.raise_for_status(r)
			return Show.model_validate(await r.json())

	async def get_movie_videos(self, slug: str) -> list[Request.Video]:
		async with self._client.get(f"movies/{slug}?with=videos") as r:
			await self.raise_for_status(r)
			movie = MovieGet.model_validate(await r.json())
			return [Request.Video(id=video.id, episodes=[]) for video in movie.videos]

	async def get_serie_videos(self, slug: str) -> list[Request.Video]:
		videos: dict[str, list[tuple[int, int] | tuple[None, int]]] = {}
		next_url: str | None = f"series/{slug}/videos?limit=250"

		while next_url is not None:
			async with self._client.get(next_url) as r:
				await self.raise_for_status(r)
				page = Page[VideoGet].model_validate(await r.json())

			for video in page.items:
				episodes = [
					(entry.seasonNumber, entry.episodeNumber)
					for entry in video.entries
					if entry.kind == "episode"
				]
				episodes += [
					(None, entry.number)
					for entry in video.entries
					if entry.kind == "special"
				]

				if video.id not in videos:
					videos[video.id] = episodes
				else:
					videos[video.id] += episodes

			next_url = page.next

		return [
			Request.Video(
				id=video_id,
				episodes=[Guess.Episode(season=s, episode=e) for s, e in set(episodes)],
			)
			for video_id, episodes in videos.items()
		]

	async def delete_movie(self, slug: str):
		async with self._client.delete(f"movies/{slug}") as r:
			await self.raise_for_status(r)

	async def delete_serie(self, slug: str):
		async with self._client.delete(f"series/{slug}") as r:
			await self.raise_for_status(r)

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
			await self.raise_for_status(r)
