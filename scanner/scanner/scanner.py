from functools import wraps
import json
import os
import asyncio
import logging
from aiohttp import ClientSession
from pathlib import Path
from guessit import guessit
from providers.provider import Provider


def log_errors(f):
	@wraps(f)
	async def internal(*args, **kwargs):
		try:
			await f(*args, **kwargs)
		except Exception as e:
			logging.exception("Unhandled error", exc_info=e)

	return internal


class Scanner:
	def __init__(
		self, client: ClientSession, *, languages: list[str], api_key: str
	) -> None:
		self._client = client
		self._api_key = api_key
		self.provider = Provider.get_all(client)[0]
		self.languages = languages

	async def scan(self, path: str):
		videos = filter(lambda p: p.is_file(), Path(path).rglob("*"))
		await asyncio.gather(*map(self.identify, videos))

	@log_errors
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
			movie.path = str(path)
			logging.debug("Got movie: %s", movie)
			await self.post("movies", data=movie.to_kyoo())
		elif raw["type"] == "episode":
			pass
		else:
			logging.warn("Unknown video file type: %s", raw["type"])

	async def post(self, path: str, *, data: object):
		url = os.environ.get("KYOO_URL", "http://back:5000")
		print(json.dumps(data, indent=4))
		async with self._client.post(
			f"{url}/{path}", json=data, headers={"X-API-Key": self._api_key}
		) as r:
			if not r.ok:
				print(await r.text())
			r.raise_for_status()
