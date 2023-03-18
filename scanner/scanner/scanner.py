import asyncio
import logging
from pathlib import Path
from guessit import guessit
from themoviedb.routes.base import ClientSession
from providers.provider import Provider

class Scanner:
	def __init__(self, client: ClientSession, languages: list[str]) -> None:
		self.provider = Provider.get_all(client)[0]
		self.languages = languages

	async def scan(self, path: str):
		videos = filter(lambda p: p.is_file(), Path(path).rglob("*"))
		await asyncio.gather(*map(self.identify, videos))

	async def identify(self, path: Path):
		raw = guessit(path)
		logging.info("Identied %s: %s", path, raw)

		# TODO: check if episode/movie already exists in kyoo and skip if it does.
		# TODO: keep a list of processing shows to only fetch metadata once even if
		#       multiples identify of the same show run on the same time
		if raw["type"] == "movie":
			movie = await self.provider.identify_movie(raw["title"], raw.get("year"), language=self.languages)
			logging.debug("Got movie: %s", movie)
		elif raw["type"] == "episode":
			pass
		else:
			logging.warn("Unknown video file type: %s", raw["type"])
