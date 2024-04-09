from dataclasses import dataclass
from dataclasses_json import DataClassJsonMixin
from typing import Literal
import os
import logging
from aio_pika import connect_robust
from aio_pika.abc import AbstractIncomingMessage

from matcher.matcher import Matcher

logger = logging.getLogger(__name__)

@dataclass
class Message(DataClassJsonMixin):
	action: Literal["scan", "delete"]
	path: str


class Subscriber:
	QUEUE = "scanner"

	async def __aenter__(self):
		self._con = await connect_robust(
			host=os.environ.get("RABBITMQ_HOST", "rabbitmq"),
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
			async with message.process():
				msg = Message.from_json(message.body)
				ack = False
				match msg.action:
					case "scan":
						ack = await scanner.identify(msg.path)
					case "delete":
						ack = await scanner.delete(msg.path)
					case _:
						logger.error(f"Invalid action: {msg.action}")
				if ack:
					await message.ack()
				else:
					await message.nack(requeue=False)

		# Allow up to 20 scan requests to run in parallel on the same listener.
		# Since most work is calling API not doing that is a waste.
		await self._channel.set_qos(prefetch_count=20)
		await self._queue.consume(on_message)
