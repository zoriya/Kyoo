import asyncio
from guessit.jsonutils import json
from aio_pika.abc import AbstractIncomingMessage
from logging import getLogger

from providers.rabbit_base import RabbitBase

logger = getLogger(__name__)


class Subscriber(RabbitBase):
	QUEUE = "scanner.rescan"

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
