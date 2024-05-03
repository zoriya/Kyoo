import os
from aio_pika import connect_robust


class RabbitBase:
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
