import asyncio
import logging
from pathlib import Path
from guessit import guessit
from themoviedb.routes.base import ClientSession, os
from providers.provider import Provider


class Scanner:
	def __init__(self, client: ClientSession, languages: list[str]) -> None:
		self._client = client
		self.provider = Provider.get_all(client)[0]
		self.languages = languages

	async def scan(self, path: str):
		videos = filter(lambda p: p.is_file(), Path(path).rglob("*"))
		await asyncio.gather(*map(self.identify, videos), return_exceptions=True)

	async def identify(self, path: Path):
		raw = guessit(path)
		logging.info("Identied %s: %s", path, raw)

		# TODO: check if episode/movie already exists in kyoo and skip if it does.
		# TODO: keep a list of processing shows to only fetch metadata once even if
		#       multiples identify of the same show run on the same time
		if raw["type"] == "movie":
			movie = await self.provider.identify_movie(
				raw["title"], raw.get("year"), language=self.languages
			)
			logging.debug("Got movie: %s", movie)
			await self.post("movies", data=movie.to_kyoo())
		elif raw["type"] == "episode":
			pass
		else:
			logging.warn("Unknown video file type: %s", raw["type"])

	async def post(self, path: str, *, data: object):
		async with self._client.post(
			f"{os.environ['KYOO_URL']}/{path}", json=data
		) as r:
			r.raise_for_status()
