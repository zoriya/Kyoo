import asyncio
from typing import Union, Literal
from msgspec import Struct, json
import os
import logging
from aio_pika import connect_robust
from aio_pika.abc import AbstractIncomingMessage

from matcher.matcher import Matcher

logger = logging.getLogger(__name__)


class Message(Struct, tag_field="action", tag=str.lower):
	pass


class Scan(Message):
	path: str


class Delete(Message):
	path: str


class Refresh(Message):
	kind: Literal["collection", "show", "movie", "season", "episode"]
	id: str


decoder = json.Decoder(Union[Scan, Delete, Refresh])


class Subscriber:
	QUEUE = "scanner"

	async def __aenter__(self):
		self._con = await connect_robust(
			host=os.environ.get("RABBITMQ_HOST", "rabbitmq"),
			port=int(os.environ.get("RABBITMQ_PORT", "5672")),
			login=os.environ.get("RABBITMQ_DEFAULT_USER", "guest"),
			password=os.environ.get("RABBITMQ_DEFAULT_PASS", "guest"),
		)
		self._channel = await self._con.channel()
		self._queue = await self._channel.declare_queue(self.QUEUE)
		return self

	async def __aexit__(self, exc_type, exc_value, exc_tb):
		await self._con.close()

	async def listen(self, scanner: Matcher):
		async def on_message(message: AbstractIncomingMessage):
			try:
				msg = decoder.decode(message.body)
				ack = False
				match msg:
					case Scan(path):
						ack = await scanner.identify(path)
					case Delete(path):
						ack = await scanner.delete(path)
					case Refresh(kind, id):
						ack = await scanner.refresh(kind, id)
					case _:
						logger.error(f"Invalid action: {msg.action}")
				if ack:
					await message.ack()
				else:
					await message.reject()
			except Exception as e:
				logger.exception("Unhandled error", exc_info=e)
				await message.reject()

		# Allow up to 20 scan requests to run in parallel on the same listener.
		# Since most work is calling API not doing that is a waste.
		await self._channel.set_qos(prefetch_count=20)
		await self._queue.consume(on_message)
		await asyncio.Future()
