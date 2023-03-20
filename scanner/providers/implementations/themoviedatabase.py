import asyncio
import logging
from aiohttp import ClientSession
from typing import Optional, Any

from ..provider import Provider
from ..types.movie import Movie, MovieTranslation
from ..types.status import Status


class TheMovieDatabase(Provider):
	def __init__(self, client: ClientSession, api_key: str) -> None:
		super().__init__()
		self._client = client
		self.base = "https://api.themoviedb.org/3"
		self.api_key = api_key

	async def get(self, path: str, *, params: dict[str, Any] = {}):
		params = {k: v for k, v in params.items() if v is not None}
		async with self._client.get(
			f"{self.base}/{path}", params={"api_key": self.api_key, **params}
		) as r:
			r.raise_for_status()
			return await r.json()

	async def identify_movie(
		self, name: str, year: Optional[int], *, language: list[str]
	) -> Movie:
		movie_id = (
			await self.get("search/movie", params={"query": name, "year": year})
		)["results"][0]["id"]

		async def for_language(lng: str) -> Movie:
			movie = await self.get(
				f"/movie/{movie_id}", params={"language": lng, "append_to_response": ""}
			)
			logging.debug("TMDb responded: %s", movie)

			ret = Movie(
				aliases=[],
				release_date=None,
				status=Status.UNKNOWN,
				studio=None,
				genres=[],
				posters=[],
				thumbnails=[],
				logos=[],
				trailers=[],
			)
			translation = MovieTranslation(
				name=movie["title"],
				keywords=[],
				overview=movie["overview"],
			)
			ret.translations = {lng: translation}
			return ret

		# TODO: make the folllowing generic
		tasks = map(lambda lng: for_language(lng), language)
		movies: list[Movie] = await asyncio.gather(*tasks)
		movie = movies[0]
		movie.translations = {k: v.translations[k] for k, v in zip(language, movies)}
		return movie
