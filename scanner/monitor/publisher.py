import os
from guessit.jsonutils import json
from aio_pika import Message, connect_robust


class Publisher:
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

	async def _publish(self, data: dict):
		await self._channel.default_exchange.publish(
			Message(json.dumps(data).encode()),
			routing_key=self.QUEUE,
		)

	async def add(self, path: str):
		await self._publish({"action": "scan", "path": path})

	async def delete(self, path: str):
		await self._publish({"action": "delete", "path": path})
