import os
import jsons
from aiohttp import ClientSession
from datetime import date
from logging import getLogger
from typing import List, Literal, Any, Optional
from urllib.parse import quote

from .utils import format_date

logger = getLogger(__name__)


class KyooClient:
	def __init__(self) -> None:
		self._api_key = os.environ.get("KYOO_APIKEY")
		if not self._api_key:
			self._api_key = os.environ.get("KYOO_APIKEYS")
			if not self._api_key:
				print("Missing environment variable 'KYOO_APIKEY'.")
				exit(2)
			self._api_key = self._api_key.split(",")[0]

		self._url = os.environ.get("KYOO_URL", "http://back:5000")

	async def __aenter__(self):
		jsons.set_serializer(lambda x, **_: format_date(x), type[Optional[date | int]])
		self.client = ClientSession(
			json_serialize=lambda *args, **kwargs: jsons.dumps(
				*args, key_transformer=jsons.KEY_TRANSFORMER_CAMELCASE, **kwargs
			),
		)
		return self

	async def __aexit__(self, exc_type, exc_value, exc_tb):
		await self.client.close()

	async def get_registered_paths(self) -> List[str]:
		paths = None
		async with self.client.get(
			f"{self._url}/episodes",
			params={"limit": 0},
			headers={"X-API-Key": self._api_key},
		) as r:
			r.raise_for_status()
			ret = await r.json()
			paths = list(x["path"] for x in ret["items"])

		async with self.client.get(
			f"{self._url}/movies",
			params={"limit": 0},
			headers={"X-API-Key": self._api_key},
		) as r:
			r.raise_for_status()
			ret = await r.json()
			paths += list(x["path"] for x in ret["items"])
		return paths

	async def create_issue(self, path: str, issue: str, extra: dict | None = None):
		async with self.client.post(
			f"{self._url}/issues",
			json={
				"domain": "scanner",
				"cause": path,
				"reason": issue,
				"extra": extra if extra is not None else {},
			},
			headers={"X-API-Key": self._api_key},
		) as r:
			if not r.ok:
				logger.error(f"Request error: {await r.text()}")
				r.raise_for_status()

	async def delete_issue(self, path: str):
		async with self.client.delete(
			f'{self._url}/issues?filter=domain eq scanner and cause eq "{path}"',
			headers={"X-API-Key": self._api_key},
		) as r:
			if not r.ok:
				logger.error(f"Request error: {await r.text()}")
				r.raise_for_status()

	async def link_collection(
		self, collection: str, type: Literal["movie"] | Literal["show"], id: str
	):
		async with self.client.put(
			f"{self._url}/collections/{collection}/{type}/{id}",
			headers={"X-API-Key": self._api_key},
		) as r:
			# Allow 409 and continue as if it worked.
			if not r.ok and r.status != 409:
				logger.error(f"Request error: {await r.text()}")
				r.raise_for_status()

	async def post(self, path: str, *, data: dict[str, Any]) -> str:
		logger.debug(
			"Sending %s: %s",
			path,
			jsons.dumps(
				data,
				key_transformer=jsons.KEY_TRANSFORMER_CAMELCASE,
				jdkwargs={"indent": 4},
			),
		)
		async with self.client.post(
			f"{self._url}/{path}",
			json=data,
			headers={"X-API-Key": self._api_key},
		) as r:
			# Allow 409 and continue as if it worked.
			if not r.ok and r.status != 409:
				logger.error(f"Request error: {await r.text()}")
				r.raise_for_status()
			ret = await r.json()

			if r.status == 409 and (
				(path == "shows" and ret["startAir"][:4] != str(data["start_air"].year))
				or (
					path == "movies"
					and ret["airDate"][:4] != str(data["air_date"].year)
				)
			):
				logger.info(
					f"Found a {path} with the same slug ({ret['slug']}) and a different date, using the date as part of the slug"
				)
				year = (data["start_air"] if path == "movie" else data["air_date"]).year
				data["slug"] = f"{ret['slug']}-{year}"
				return await self.post(path, data=data)
			return ret["id"]

	async def delete(
		self,
		path: str,
		type: Literal["episode", "movie"] | None = None,
	):
		logger.info("Deleting %s", path)

		if type is None or type == "movie":
			async with self.client.delete(
				f'{self._url}/movies?filter=path eq "{quote(path)}"',
				headers={"X-API-Key": self._api_key},
			) as r:
				if not r.ok:
					logger.error(f"Request error: {await r.text()}")
					r.raise_for_status()

		if type is None or type == "episode":
			async with self.client.delete(
				f'{self._url}/episodes?filter=path eq "{quote(path)}"',
				headers={"X-API-Key": self._api_key},
			) as r:
				if not r.ok:
					logger.error(f"Request error: {await r.text()}")
					r.raise_for_status()

		await self.delete_issue(path)
