import os
from logging import getLogger

from aiohttp import ClientSession

from .models.videos import Video, VideoCreated, VideoInfo

logger = getLogger(__name__)


class KyooClient:
	def __init__(self) -> None:
		self._api_key: str = os.environ.get("KYOO_APIKEY")  # type: ignore
		if not self._api_key:
			print("Missing environment variable 'KYOO_APIKEY'.")
			exit(2)
		self._url = os.environ.get("KYOO_URL", "http://api:3567/api")

	async def __aenter__(self):
		self._client = ClientSession(
			headers={
				"User-Agent": "kyoo",
			},
		)
		return self

	async def __aexit__(self):
		await self._client.close()

	async def get_videos_info(self) -> VideoInfo:
		async with self._client.get(
			f"{self._url}/videos",
		) as r:
			r.raise_for_status()
			return VideoInfo(**await r.json())

	async def create_videos(self, videos: list[Video]) -> list[VideoCreated]:
		async with self._client.post(
			f"{self._url}/videos",
			json=[x.model_dump_json() for x in videos],
		) as r:
			r.raise_for_status()
			return list[VideoCreated](** await r.json())

	async def delete_videos(self, videos: list[str] | set[str]):
		async with self._client.delete(
			f"{self._url}/videos",
			json=videos,
		) as r:
			r.raise_for_status()

	# async def link_collection(
	# 	self, collection: str, type: Literal["movie"] | Literal["show"], id: str
	# ):
	# 	async with self.client.put(
	# 		f"{self._url}/collections/{collection}/{type}/{id}",
	# 		headers={"X-API-Key": self._api_key},
	# 	) as r:
	# 		# Allow 409 and continue as if it worked.
	# 		if not r.ok and r.status != 409:
	# 			logger.error(f"Request error: {await r.text()}")
	# 			r.raise_for_status()
	#
	# async def post(self, path: str, *, data: dict[str, Any]) -> str:
	# 	logger.debug(
	# 		"Sending %s: %s",
	# 		path,
	# 		jsons.dumps(
	# 			data,
	# 			key_transformer=jsons.KEY_TRANSFORMER_CAMELCASE,
	# 			jdkwargs={"indent": 4},
	# 		),
	# 	)
	# 	async with self.client.post(
	# 		f"{self._url}/{path}",
	# 		json=data,
	# 		headers={"X-API-Key": self._api_key},
	# 	) as r:
	# 		# Allow 409 and continue as if it worked.
	# 		if not r.ok and r.status != 409:
	# 			logger.error(f"Request error: {await r.text()}")
	# 			r.raise_for_status()
	# 		ret = await r.json()
	# 		return ret["id"]
	#
	# async def delete(
	# 	self,
	# 	path: str,
	# ):
	# 	logger.info("Deleting %s", path)
	#
	# 	async with self.client.delete(
	# 		f"{self._url}/paths?recursive=true&path={quote(path)}",
	# 		headers={"X-API-Key": self._api_key},
	# 	) as r:
	# 		if not r.ok:
	# 			logger.error(f"Request error: {await r.text()}")
	# 			r.raise_for_status()
	#
	# async def get(self, path: str):
	# 	async with self.client.get(
	# 		f"{self._url}/{path}",
	# 		headers={"X-API-Key": self._api_key},
	# 	) as r:
	# 		if not r.ok:
	# 			logger.error(f"Request error: {await r.text()}")
	# 			r.raise_for_status()
	# 		return await r.json()
	#
	# async def put(self, path: str, *, data: dict[str, Any]):
	# 	logger.debug(
	# 		"Sending %s: %s",
	# 		path,
	# 		jsons.dumps(
	# 			data,
	# 			key_transformer=jsons.KEY_TRANSFORMER_CAMELCASE,
	# 			jdkwargs={"indent": 4},
	# 		),
	# 	)
	# 	async with self.client.put(
	# 		f"{self._url}/{path}",
	# 		json=data,
	# 		headers={"X-API-Key": self._api_key},
	# 	) as r:
	# 		# Allow 409 and continue as if it worked.
	# 		if not r.ok and r.status != 409:
	# 			logger.error(f"Request error: {await r.text()}")
	# 			r.raise_for_status()
