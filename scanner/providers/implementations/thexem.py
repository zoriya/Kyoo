import logging
from typing import Dict, List, Literal
from aiohttp import ClientSession
from datetime import timedelta, datetime
from functools import wraps

from providers.utils import ProviderError


def cache(ttl: timedelta):
	def wrap(func):
		time, value = None, None

		@wraps(func)
		async def wrapped(*args, **kw):
			nonlocal time
			nonlocal value
			now = datetime.now()
			if not time or now - time > ttl:
				value = await func(*args, **kw)
				time = now
			return value

		return wrapped

	return wrap


class TheXem:
	def __init__(self, client: ClientSession) -> None:
		self._client = client
		self.base = "https://thexem.info"

	# TODO: make the cache support different providers and handle concurrent calls to the function.
	@cache(ttl=timedelta(days=1))
	async def get_map(
		self, provider: Literal["tvdb"] | Literal["anidb"]
	) -> Dict[str, List[Dict[str, int]]]:
		logging.info("Fetching data from thexem for %s", provider)
		async with self._client.get(
			f"{self.base}/map/allNames",
			params={
				"origin": provider,
				"seasonNumbers": True,
			},
		) as r:
			r.raise_for_status()
			ret = await r.json()
			if "data" not in ret or ret["result"] == "failure":
				logging.error("Could not fetch xem metadata. Error: %s", ret["message"])
				raise ProviderError("Could not fetch xem metadata")
			return ret["data"]

	@cache(ttl=timedelta(days=1))
	async def get_show_map(
		self, provider: Literal["tvdb"] | Literal["anidb"], id: str
	) -> List[
		Dict[
			Literal["scene"] | Literal["tvdb"] | Literal["anidb"],
			Dict[Literal["season"] | Literal["episode"] | Literal["absolute"], int],
		]
	]:
		logging.info("Fetching from thexem the map of %s (%s)", id, provider)
		async with self._client.get(
			f"{self.base}/map/all",
			params={
				"id": id,
				"origin": provider,
			},
		) as r:
			r.raise_for_status()
			ret = await r.json()
			if "data" not in ret or ret["result"] == "failure":
				logging.error("Could not fetch xem mapping. Error: %s", ret["message"])
				raise ProviderError("Could not fetch xem mapping")
			return ret["data"]

	async def get_season_override(
		self, provider: Literal["tvdb"] | Literal["anidb"], id: str, show_name: str
	):
		map = await self.get_map(provider)
		if id not in map:
			return None
		for x in map[id]:
			[(name, season)] = x.items()
			# TODO: replace .lower() with something a bit smarter
			if show_name.lower() == name.lower():
				return season
		return None

	async def get_episode_override(
		self,
		provider: Literal["tvdb"] | Literal["anidb"],
		id: str,
		show_name: str,
		episode: int,
	):
		master_season = await self.get_season_override(provider, id, show_name)
		# master season is not always a direct translation with a tvdb season, we need to translate that back
		map = await self.get_show_map(provider, id)
		ep = next(
			(
				x
				for x in map
				if x["scene"]["season"] == master_season
				and x["scene"]["episode"] == episode
			),
			None,
		)
		if ep is None:
			logging.warning(
				"Could not get xem mapping for show %s, falling back to identifier mapping.",
				show_name,
			)
			return [master_season, episode, None]

		# Only tvdb has a proper absolute handling so we always use this one.
		return (ep[provider]["season"], ep[provider]["episode"], ep["tvdb"]["absolute"])
