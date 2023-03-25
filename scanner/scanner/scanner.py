from functools import wraps
import os
import asyncio
import logging
import jsons
from aiohttp import ClientSession
from pathlib import Path
from guessit import guessit
from providers.provider import Provider
from providers.types.episode import Episode, PartialShow
from providers.types.show import Show


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
		self.cache = {"shows": {}}
		self.languages = languages

	async def scan(self, path: str):
		videos = filter(lambda p: p.is_file(), Path(path).rglob("*"))
		await asyncio.gather(*map(self.identify, videos))

	@log_errors
	async def identify(self, path: Path):
		raw = guessit(path, "--episode-prefer-number")
		logging.info("Identied %s: %s", path, raw)

		# TODO: check if episode/movie already exists in kyoo and skip if it does.
		# TODO: keep a list of processing shows to only fetch metadata once even if
		#       multiples identify of the same show run on the same time

		# TODO: Add collections support
		if raw["type"] == "movie":
			return
			movie = await self.provider.identify_movie(
				raw["title"], raw.get("year"), language=self.languages
			)
			movie.path = str(path)
			logging.debug("Got movie: %s", movie)
			await self.post("movies", data=movie.to_kyoo())
		elif raw["type"] == "episode":
			episode = await self.provider.identify_episode(
				raw["title"],
				season=raw.get("season"),
				episode_nbr=raw.get("episode"),
				absolute=raw.get("episode") if "season" not in raw else None,
				language=self.languages,
			)
			episode.path = str(path)
			logging.debug("Got episode: %s", episode)

			show_provider_id = episode.show.external_id[self.provider.name].id
			if (
				isinstance(episode.show, PartialShow)
				and show_provider_id not in self.cache["shows"]
			):
				show = await self.provider.identify_show(
					episode.show, language=self.languages
				)
				logging.debug("Got show: %s", episode)
				self.cache["shows"][show_provider_id] = await self.post("show", data=show.to_kyoo())
			episode.show_id = self.cache["shows"][show_provider_id]
			await self.post("episodes", data=episode.to_kyoo())
		else:
			logging.warn("Unknown video file type: %s", raw["type"])

	async def post(self, path: str, *, data: object) -> str:
		url = os.environ.get("KYOO_URL", "http://back:5000")
		logging.info(
			"Sending %s: %s",
			path,
			jsons.dumps(
				data,
				key_transformer=jsons.KEY_TRANSFORMER_CAMELCASE,
				jdkwargs={"indent": 4},
			),
		)
		async with self._client.post(
			f"{url}/{path}", json=data, headers={"X-API-Key": self._api_key}
		) as r:
			if not r.ok:
				print(await r.text())
			r.raise_for_status()
			ret = await r.json()
			return ret["id"]

