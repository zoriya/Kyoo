import asyncio
from datetime import datetime
import logging
from aiohttp import ClientSession
from typing import Callable, Dict, Optional, Any

from providers.types.genre import Genre

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

	def get_image(
		self, images: list[Dict[str, Any]], filter: Callable[[Dict[str, Any]], bool]
	) -> list[str]:
		return [
			f"https://image.tmdb.org/t/p/original{x['file_path']}"
			for x in images
			if x["file_path"] and filter(x)
		]

	async def identify_movie(
		self, name: str, year: Optional[int], *, language: list[str]
	) -> Movie:
		search = (await self.get("search/movie", params={"query": name, "year": year}))[
			"results"
		][0]
		movie_id = search["id"]

		async def for_language(lng: str) -> Movie:
			movie = await self.get(
				f"/movie/{movie_id}",
				params={
					"language": lng,
					"append_to_response": "alternative_titles,videos,credits,keywords,images",
					"include_image_language": ",".join(
						[lng, search["original_language"]]
					),
				},
			)
			logging.debug("TMDb responded: %s", movie)

			ret = Movie(
				aliases=list(map(lambda x: x["title"], movie["alternative_titles"])),
				release_date=datetime.strptime(
					movie["release_date"], "%Y-%m-%d"
				).date(),
				status=Status.FINISHED
				if movie["Status"] == "Released"
				else Status.PLANNED,
				studios=list(map(lambda x: x["name"], movie["production_companies"])),
				genres=list(map(lambda x: Genre(x["name"]), movie["genres"])),
				original_posters=self.get_image(
					movie["images"]["posters"],
					lambda x: x["iso_639_1"] == search["original_language"],
				),
				thumbnails=self.get_image(
					movie["images"]["backdrops"],
					lambda x: x["iso_639_1"] == lng,
				),
				# TODO: Add external IDs.
				# TODO: Add cast information
			)
			translation = MovieTranslation(
				name=movie["title"],
				tagline=movie["tagline"],
				keywords=list(map(lambda x: x["name"], movie["keywords"])),
				overview=movie["overview"],
				posters=self.get_image(
					movie["images"]["posters"],
					lambda x: x["iso_639_1"] == lng,
				),
				logos=self.get_image(
					movie["images"]["logos"],
					lambda x: x["iso_639_1"] == lng,
				),
				trailers=[
					f"https://www.youtube.com/watch?v{x['key']}"
					for x in movie["videos"]["results"]
					if x["type"] == "Trailer" and x["site"] == "YouTube"
				],
			)
			ret.translations = {lng: translation}
			return ret

		# TODO: make the folllowing generic
		tasks = map(lambda lng: for_language(lng), language)
		movies: list[Movie] = await asyncio.gather(*tasks)
		movie = movies[0]
		movie.translations = {k: v.translations[k] for k, v in zip(language, movies)}
		return movie
