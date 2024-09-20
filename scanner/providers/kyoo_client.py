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
			headers={
				"User-Agent": "kyoo",
			},
			json_serialize=lambda *args, **kwargs: jsons.dumps(
				*args, key_transformer=jsons.KEY_TRANSFORMER_CAMELCASE, **kwargs
			),
		)
		return self

	async def __aexit__(self, exc_type, exc_value, exc_tb):
		await self.client.close()

	async def get_registered_paths(self) -> List[str]:
		async with self.client.get(
			f"{self._url}/paths",
			headers={"X-API-Key": self._api_key},
		) as r:
			r.raise_for_status()
			return await r.json()

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

	async def get_issues(self) -> List[str]:
		async with self.client.get(
			f"{self._url}/issues",
			params={"limit": 0},
			headers={"X-API-Key": self._api_key},
		) as r:
			r.raise_for_status()
			ret = await r.json()
			return [x["cause"] for x in ret if x["domain"] == "scanner"]

	async def delete_issue(self, path: str):
		async with self.client.delete(
			f'{self._url}/issues?filter=domain eq scanner and cause eq "{quote(path)}"',
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
			return ret["id"]

	async def delete(
		self,
		path: str,
	):
		logger.info("Deleting %s", path)

		async with self.client.delete(
			f"{self._url}/paths?recursive=true&path={quote(path)}",
			headers={"X-API-Key": self._api_key},
		) as r:
			if not r.ok:
				logger.error(f"Request error: {await r.text()}")
				r.raise_for_status()

	async def get(self, path: str):
		async with self.client.get(
			f"{self._url}/{path}",
			headers={"X-API-Key": self._api_key},
		) as r:
			if not r.ok:
				logger.error(f"Request error: {await r.text()}")
				r.raise_for_status()
			return await r.json()

	async def put(self, path: str, *, data: dict[str, Any]):
		logger.debug(
			"Sending %s: %s",
			path,
			jsons.dumps(
				data,
				key_transformer=jsons.KEY_TRANSFORMER_CAMELCASE,
				jdkwargs={"indent": 4},
			),
		)
		async with self.client.put(
			f"{self._url}/{path}",
			json=data,
			headers={"X-API-Key": self._api_key},
		) as r:
			# Allow 409 and continue as if it worked.
			if not r.ok and r.status != 409:
				logger.error(f"Request error: {await r.text()}")
				r.raise_for_status()
