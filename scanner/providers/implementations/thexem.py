import re
import logging
from typing import Dict, List, Literal
from aiohttp import ClientSession
from datetime import timedelta

from providers.utils import ProviderError
from matcher.cache import cache


def clean(s: str):
	s = s.lower()
	# remove content of () (guessit does not allow them as part of a name)
	s = re.sub(r"\([^)]*\)", "", s)
	# remove separators
	s = re.sub(r"[:\-_/\\&|,;.=\"'+~～@`ー]+", " ", s)
	# remove subsequent spaces (that may be introduced above)
	s = re.sub(r" +", " ", s)
	return s


class TheXem:
	def __init__(self, client: ClientSession) -> None:
		self._client = client
		self.base = "https://thexem.info"

	@cache(ttl=timedelta(days=1))
	async def get_map(
		self, provider: Literal["tvdb"] | Literal["anidb"]
	) -> Dict[str, List[Dict[str, int]]]:
		logging.info("Fetching data from thexem for %s", provider)
		async with self._client.get(
			f"{self.base}/map/allNames",
			params={
				"origin": provider,
				"seasonNumbers": 1,  # 1 here means true
				"defaultNames": 1,
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
				return []
			return ret["data"]

	async def get_show_override(
		self, provider: Literal["tvdb"] | Literal["anidb"], show_name: str
	):
		map = await self.get_map(provider)
		show_name = clean(show_name)
		for [id, v] in map.items():
			# Only the first element is a string (the show name) so we need to ignore the type hint
			master_show_name: str = v[0]  # type: ignore
			for x in v[1:]:
				[(name, season)] = x.items()
				if show_name == clean(name):
					return master_show_name, id
		return None, None

	async def get_season_override(
		self, provider: Literal["tvdb"] | Literal["anidb"], id: str, show_name: str
	):
		map = await self.get_map(provider)
		if id not in map:
			return None
		show_name = clean(show_name)
		# Ignore the first element, this is the show name has a string
		for x in map[id][1:]:
			[(name, season)] = x.items()
			# TODO: replace .lower() with something a bit smarter
			if show_name == clean(name):
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

		# -1 means this is the show's name, not season specific.
		# we do not need to remap episodes numbers.
		if master_season is None or master_season == -1:
			return [None, None, episode]

		logging.info(
			"Fount xem override for show %s, ep %d. Master season: %d",
			show_name,
			episode,
			master_season,
		)

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
			return [master_season, episode, episode]

		# Only tvdb has a proper absolute handling so we always use this one.
		return (ep[provider]["season"], ep[provider]["episode"], ep["tvdb"]["absolute"])

	@cache(ttl=timedelta(days=1))
	async def get_expected_titles(
		self, provider: Literal["tvdb"] | Literal["anidb"] = "tvdb"
	) -> list[str]:
		map = await self.get_map(provider)
		titles = []

		for x in map.values():
			# Only the first element is a string (the show name) so we need to ignore the type hint
			master_show_name: str = x[0]  # type: ignore
			titles.append(clean(master_show_name))
			for y in x[1:]:
				titles.extend(clean(name) for name in y.keys())
		return titles
