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
from providers.types.season import Season


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
		self._url = os.environ.get("KYOO_URL", "http://back:5000")
		self.provider = Provider.get_all(client)[0]
		self.cache = {"shows": {}}
		self.languages = languages

	async def scan(self, path: str):
		videos = filter(lambda p: p.is_file(), Path(path).rglob("*"))
		await asyncio.gather(*map(self.identify, videos))

	async def is_registered(self, path: Path) -> bool:
		# TODO: Once movies are separated from the api, a new endpoint should be created to check for paths.
		async with self._client.get(
			f"{self._url}/episodes/count",
			params={"path": str(path)},
			headers={"X-API-Key": self._api_key},
		) as r:
			r.raise_for_status()
			ret = await r.text()
			if ret != "0":
				return True
		return False


	@log_errors
	async def identify(self, path: Path):
		if await self.is_registered(path):
			return
		raw = guessit(path, "--episode-prefer-number")
		logging.info("Identied %s: %s", path, raw)

		# TODO: check if episode/movie already exists in kyoo and skip if it does.
		# TODO: Add collections support
		if raw["type"] == "movie":
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
			# TODO: Do the same things for seasons and wait for them to be created on the api (else the episode creation will fail)
			await self.post("episodes", data=episode.to_kyoo())
		else:
			logging.warn("Unknown video file type: %s", raw["type"])

	async def create_or_get_show(self, episode: Episode) -> str:
		provider_id = episode.show.external_ids[self.provider.name].id
		if provider_id in self.cache["shows"]:
			ret = self.cache["shows"][provider_id]
			await ret["event"].wait()
			if not ret["id"]:
				raise RuntimeError("Provider failed to create the show")
			return ret["id"]

		self.cache["shows"][provider_id] = {"id": None, "event": asyncio.Event()}

		# TODO: Check if a show with the same metadata id exists already on kyoo.

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
		self.cache["shows"][provider_id]["id"] = ret
		self.cache["shows"][provider_id]["event"].set()

		# TODO: Better handling of seasons registrations (maybe a lock also)
		await self.register_seasons(ret, show.seasons)
		return ret

	async def register_seasons(self, show_id: str, seasons: list[Season]):
		for season in seasons:
			season.show_id = show_id
			await self.post("seasons", data=season.to_kyoo())

	async def post(self, path: str, *, data: object) -> str:
		logging.debug(
			"Sending %s: %s",
			path,
			jsons.dumps(
				data,
				key_transformer=jsons.KEY_TRANSFORMER_CAMELCASE,
				jdkwargs={"indent": 4},
			),
		)
		async with self._client.post(
			f"{self._url}/{path}",
			json=data,
			headers={"X-API-Key": self._api_key},
		) as r:
			# Allow 409 and continue as if it worked.
			if not r.ok and r.status != 409:
				logging.error(f"Request error: {await r.text()}")
				r.raise_for_status()
			ret = await r.json()
			return ret["id"]
