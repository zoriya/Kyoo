from datetime import timedelta
from typing import Literal, Optional
import asyncio
from logging import getLogger
from old.provider import Provider, ProviderError
from old.types.collection import Collection
from old.types.show import Show
from old.types.episode import Episode, PartialShow
from old.types.season import Season
from old.kyoo_client import KyooClient
from .parser.guess import guessit
from .cache import cache, exec_as_cache, make_key

logger = getLogger(__name__)


class Matcher:
	def __init__(self, client: KyooClient, provider: Provider) -> None:
		self._client = client
		self._provider = provider

	async def refresh(
		self,
		kind: Literal["collection", "movie", "episode", "show", "season"],
		kyoo_id: str,
	):
		async def id_movie(movie: dict, id: dict):
			ret = await self._provider.identify_movie(id["dataId"])
			ret.path = movie["path"]
			return ret

		async def id_season(season: dict, id: dict):
			ret = await self._provider.identify_season(
				id["dataId"], season["seasonNumber"]
			)
			ret.show_id = season["showId"]
			return ret

		async def id_episode(episode: dict, id: dict):
			ret = await self._provider.identify_episode(
				id["showId"], id["season"], id["episode"], episode["absoluteNumber"]
			)
			ret.show_id = episode["showId"]
			ret.season_id = episode["seasonId"]
			ret.path = episode["path"]
			return ret

		identify_table = {
			"collection": lambda _, id: self._provider.identify_collection(
				id["dataId"]
			),
			"movie": id_movie,
			"show": lambda _, id: self._provider.identify_show(id["dataId"]),
			"season": id_season,
			"episode": id_episode,
		}

		current = await self._client.get(f"{kind}/{kyoo_id}")
		if self._provider.name not in current["externalId"]:
			logger.error(
				f"Could not refresh metadata of {kind}/{kyoo_id}. Missing provider id."
			)
			return False
		provider_id = current["externalId"][self._provider.name]
		new_value = await identify_table[kind](current, provider_id)
		await self._client.put(f"{kind}/{kyoo_id}", data=new_value.to_kyoo())
		return True
