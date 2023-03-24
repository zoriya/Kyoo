import asyncio
from datetime import datetime
import logging
from aiohttp import ClientSession
from typing import Callable, Dict, Optional, Any

from providers.types.genre import Genre
from providers.types.metadataid import MetadataID

from ..provider import Provider
from ..types.movie import Movie, MovieTranslation
from ..types.episode import Episode
from ..types.studio import Studio


class TheMovieDatabase(Provider):
	def __init__(self, client: ClientSession, api_key: str) -> None:
		super().__init__()
		self._client = client
		self.base = "https://api.themoviedb.org/3"
		self.api_key = api_key
		self.genre_map = {
			28: Genre.ACTION,
			12: Genre.ADVENTURE,
			16: Genre.ANIMATION,
			35: Genre.COMEDY,
			80: Genre.CRIME,
			99: Genre.DOCUMENTARY,
			18: Genre.DRAMA,
			10751: Genre.FAMILY,
			14: Genre.FANTASY,
			36: Genre.HISTORY,
			27: Genre.HORROR,
			10402: Genre.MUSIC,
			9648: Genre.MYSTERY,
			10749: Genre.ROMANCE,
			878: Genre.SCIENCE_FICTION,
			53: Genre.THRILLER,
			10752: Genre.WAR,
			37: Genre.WESTERN,
		}

	async def get(self, path: str, *, params: dict[str, Any] = {}):
		params = {k: v for k, v in params.items() if v is not None}
		async with self._client.get(
			f"{self.base}/{path}", params={"api_key": self.api_key, **params}
		) as r:
			r.raise_for_status()
			return await r.json()

	def get_image(self, images: list[Dict[str, Any]]) -> list[str]:
		return [
			f"https://image.tmdb.org/t/p/original{x['file_path']}"
			for x in images
			if x["file_path"]
		]

	async def identify_movie(
		self, name: str, year: Optional[int], *, language: list[str]
	) -> Movie:
		search = (await self.get("search/movie", params={"query": name, "year": year}))[
			"results"
		][0]
		movie_id = search["id"]
		if search["original_language"] not in language:
			language.append(search["original_language"])

		async def for_language(lng: str) -> Movie:
			movie = await self.get(
				f"/movie/{movie_id}",
				params={
					"language": lng,
					"append_to_response": "alternative_titles,videos,credits,keywords,images",
				},
			)
			logging.debug("TMDb responded: %s", movie)
			# TODO: Use collection data

			ret = Movie(
				original_language=movie["original_language"],
				aliases=[x["title"] for x in movie["alternative_titles"]["titles"]],
				release_date=datetime.strptime(
					movie["release_date"], "%Y-%m-%d"
				).date(),
				status=Status.FINISHED
				if movie["status"] == "Released"
				else Status.PLANNED,
				studios=[
					Studio(
						name=x["name"],
						logos=[f"https://image.tmdb.org/t/p/original{x['logo_path']}"]
						if "logo_path" in x
						else [],
						external_id={
							"themoviedatabase": MetadataID(
								x["id"], f"https://www.themoviedb.org/company/{x['id']}"
							)
						},
					)
					for x in movie["production_companies"]
				],
				genres=[
					self.genre_map[x["id"]]
					for x in movie["genres"]
					if x["id"] in self.genre_map
				],
				external_id={
					"themoviedatabase": MetadataID(
						movie["id"], f"https://www.themoviedb.org/movie/{movie['id']}"
					),
					"imdb": MetadataID(
						movie["imdb_id"],
						f"https://www.imdb.com/title/{movie['imdb_id']}",
					),
				}
				# TODO: Add cast information
			)
			translation = MovieTranslation(
				name=movie["title"],
				tagline=movie["tagline"],
				keywords=list(map(lambda x: x["name"], movie["keywords"]["keywords"])),
				overview=movie["overview"],
				posters=self.get_image(movie["images"]["posters"]),
				logos=self.get_image(movie["images"]["logos"]),
				thumbnails=self.get_image(movie["images"]["backdrops"]),
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


	async def identify_episode(
		self,
		name: str,
		season: Optional[int],
		episode: Optional[int],
		absolute: Optional[int],
		*,
		language: list[str]
	) -> Episode:
		raise NotImplementedError
