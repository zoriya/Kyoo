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
			episode.show_id = await self.create_or_get_show(episode)
			await self.post("episodes", data=episode.to_kyoo())
		else:
			logging.warn("Unknown video file type: %s", raw["type"])

	async def create_or_get_show(self, episode: Episode) -> str:
		provider_id = episode.show.external_id[self.provider.name].id
		if provider_id in self.cache["shows"]:
			ret = self.cache["shows"][provider_id]
			print(f"Waiting for {provider_id}")
			await ret["event"].wait()
			if not ret["id"]:
				raise RuntimeError("Provider failed to create the show")
			return ret["id"]

		self.cache["shows"][provider_id] = {"id": None, "event": asyncio.Event()}
		show = (
			await self.provider.identify_show(episode.show, language=self.languages)
			if isinstance(episode.show, PartialShow)
			else episode.show
		)
		logging.debug("Got show: %s", episode)
		try:
			ret = await self.post("show", data=show.to_kyoo())
		except:
			# Allow tasks waiting for this show to bail out.
			self.cache["shows"][provider_id]["event"].set()
			raise
		print(f"setting {provider_id}")
		self.cache["shows"][provider_id]["id"] = ret
		self.cache["shows"][provider_id]["event"].set()
		return ret

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
			f"{url}/{path}",
			json=data,
			headers={"X-API-Key": self._api_key},
		) as r:
			if not r.ok:
				print(await r.text())
			r.raise_for_status()
			ret = await r.json()
			return ret["id"]
