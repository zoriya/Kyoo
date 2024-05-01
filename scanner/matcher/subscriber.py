import asyncio
from typing import Union, Literal
from msgspec import Struct, json
from logging import getLogger
from aio_pika.abc import AbstractIncomingMessage

from scanner.publisher import Publisher
from scanner.scanner import scan

from matcher.matcher import Matcher

logger = getLogger(__name__)


class Message(Struct, tag_field="action", tag=str.lower):
	pass


class Scan(Message):
	path: str


class Delete(Message):
	path: str


class Refresh(Message):
	kind: Literal["collection", "show", "movie", "season", "episode"]
	id: str


class Rescan(Message):
	pass


decoder = json.Decoder(Union[Scan, Delete, Refresh, Rescan])


class Subscriber(Publisher):
	async def listen(self, matcher: Matcher):
		async def on_message(message: AbstractIncomingMessage):
			try:
				msg = decoder.decode(message.body)
				ack = False
				match msg:
					case Scan(path):
						ack = await matcher.identify(path)
					case Delete(path):
						ack = await matcher.delete(path)
					case Refresh(kind, id):
						ack = await matcher.refresh(kind, id)
					case Rescan():
						await scan(None, self, matcher._client)
						ack = True
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
