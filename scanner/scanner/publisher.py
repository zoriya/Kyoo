from guessit.jsonutils import json
from aio_pika import Message
from logging import getLogger
from typing import Literal

from providers.rabbit_base import RabbitBase

logger = getLogger(__name__)


class Publisher(RabbitBase):
	async def _publish(self, data: dict):
		await self._channel.default_exchange.publish(
			Message(json.dumps(data).encode()),
			routing_key=self.QUEUE,
		)

	async def add(self, path: str):
		await self._publish({"action": "scan", "path": path})

	async def delete(self, path: str):
		await self._publish({"action": "delete", "path": path})

	async def refresh(
		self,
		kind: Literal["collection", "show", "movie", "season", "episode"],
		id: str,
		**_kwargs,
	):
		await self._publish({"action": "refresh", "kind": kind, "id": id})
