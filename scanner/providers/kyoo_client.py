from datetime import timedelta
import os
import asyncio
import logging
import jsons
import re
from aiohttp import ClientSession
from pathlib import Path
from typing import List, Literal, Any
from urllib.parse import quote
from providers.provider import Provider, ProviderError
from providers.types.collection import Collection
from providers.types.show import Show
from providers.types.episode import Episode, PartialShow
from providers.types.season import Season


class KyooClient:
	def __init__(
		self, client: ClientSession, *, api_key: str
	) -> None:
		self._client = client
		self._api_key = api_key
		self._url = os.environ.get("KYOO_URL", "http://back:5000")


	async def get_issues(self) -> List[str]:
		async with self._client.get(
			f"{self._url}/issues",
			params={"limit": 0},
			headers={"X-API-Key": self._api_key},
		) as r:
			r.raise_for_status()
			ret = await r.json()
			return [x["cause"] for x in ret if x["domain"] == "scanner"]

	async def link_collection(
		self, collection: str, type: Literal["movie"] | Literal["show"], id: str
	):
		async with self._client.put(
			f"{self._url}/collections/{collection}/{type}/{id}",
			headers={"X-API-Key": self._api_key},
		) as r:
			# Allow 409 and continue as if it worked.
			if not r.ok and r.status != 409:
				logging.error(f"Request error: {await r.text()}")
				r.raise_for_status()

	async def post(self, path: str, *, data: dict[str, Any]) -> str:
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

			if r.status == 409 and (
				(path == "shows" and ret["startAir"][:4] != str(data["start_air"].year))
				or (
					path == "movies"
					and ret["airDate"][:4] != str(data["air_date"].year)
				)
			):
				logging.info(
					f"Found a {path} with the same slug ({ret['slug']}) and a different date, using the date as part of the slug"
				)
				year = (data["start_air"] if path == "movie" else data["air_date"]).year
				data["slug"] = f"{ret['slug']}-{year}"
				return await self.post(path, data=data)
			return ret["id"]

	async def delete(
		self,
		path: str,
		type: Literal["episode", "movie", "issue"] | None = None,
	):
		logging.info("Deleting %s", path)
		self.registered = filter(lambda x: x != path, self.registered)

		if type is None or type == "movie":
			async with self._client.delete(
				f'{self._url}/movies?filter=path eq "{quote(path)}"',
				headers={"X-API-Key": self._api_key},
			) as r:
				if not r.ok:
					logging.error(f"Request error: {await r.text()}")
					r.raise_for_status()

		if type is None or type == "episode":
			async with self._client.delete(
				f'{self._url}/episodes?filter=path eq "{quote(path)}"',
				headers={"X-API-Key": self._api_key},
			) as r:
				if not r.ok:
					logging.error(f"Request error: {await r.text()}")
					r.raise_for_status()

		if path in self.issues:
			self.issues = filter(lambda x: x != path, self.issues)
			await self._client.delete(
				f'{self._url}/issues?filter=domain eq scanner and cause eq "{quote(path)}"',
				headers={"X-API-Key": self._api_key},
			)

