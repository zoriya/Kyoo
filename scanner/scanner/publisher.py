import asyncio
from guessit.jsonutils import json
from aio_pika import Message
from aio_pika.abc import AbstractIncomingMessage
from logging import getLogger
from typing import Literal

from providers.rabbit_base import RabbitBase

logger = getLogger(__name__)


class Publisher(RabbitBase):
	QUEUE_RESCAN = "scanner.rescan"

	async def __aenter__(self):
		await super().__aenter__()
		self._queue = await self._channel.declare_queue(self.QUEUE_RESCAN)
		return self

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

	async def listen(self, scan):
		async def on_message(message: AbstractIncomingMessage):
			try:
				await scan()
				await message.ack()
			except Exception as e:
				logger.exception("Unhandled error", exc_info=e)
				await message.reject()

		await self._queue.consume(on_message)
		await asyncio.Future()
