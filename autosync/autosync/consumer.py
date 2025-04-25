import asyncio
from msgspec import json
import os
from logging import getLogger
from aio_pika import ExchangeType, connect_robust
from aio_pika.abc import AbstractIncomingMessage

from autosync.services.service import Service
from autosync.models.message import Message


logger = getLogger(__name__)


class Consumer:
	QUEUE = "autosync"

	async def __aenter__(self):
		self._con = await connect_robust(
			os.environ.get("RABBITMQ_URL"),
			host=os.environ.get("RABBITMQ_HOST", "rabbitmq"),
			port=int(os.environ.get("RABBITMQ_PORT", "5672")),
			login=os.environ.get("RABBITMQ_DEFAULT_USER", "guest"),
			password=os.environ.get("RABBITMQ_DEFAULT_PASS", "guest"),
		)
		self._channel = await self._con.channel()
		self._exchange = await self._channel.declare_exchange(
			"events.watched", type=ExchangeType.TOPIC
		)
		self._queue = await self._channel.declare_queue(self.QUEUE)
		await self._queue.bind(self._exchange, routing_key="#")
		return self

	async def __aexit__(self, exc_type, exc_value, exc_tb):
		await self._con.close()

	async def listen(self, service: Service):
		async def on_message(message: AbstractIncomingMessage):
			try:
				msg = json.decode(message.body, type=Message)
				service.update(msg.value.user, msg.value.resource, msg.value)
				await message.ack()
			except Exception as e:
				logger.exception("Unhandled error", exc_info=e)
				await message.reject()

		# Allow up to 20 requests to run in parallel on the same listener.
		# Since most work is calling API not doing that is a waste.
		await self._channel.set_qos(prefetch_count=20)
		await self._queue.consume(on_message)
		logger.info("Listening for autosync.")
		await asyncio.Future()
