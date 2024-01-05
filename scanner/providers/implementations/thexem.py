import asyncio
import logging
from typing import Dict, List, Literal, Tuple
from aiohttp import ClientSession
from datetime import timedelta, datetime
from functools import wraps

from providers.types.episode import Episode
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
			ret = (await r.json())
			if "data" not in ret or ret["result"] == "failure":
				logging.error("Could not fetch xem metadata. Error: %s", ret["message"])
				raise ProviderError("Could not fetch xem metadata")
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
