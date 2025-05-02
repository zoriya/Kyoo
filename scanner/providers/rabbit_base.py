import os
from aio_pika import connect_robust


class RabbitBase:
	QUEUE = "scanner"

	async def __aenter__(self):
		self._con = await connect_robust(
			os.environ.get("RABBITMQ_URL"),
			host=os.environ.get("RABBITMQ_HOST", "rabbitmq"),
			port=int(os.environ.get("RABBITMQ_PORT", "5672")),
			login=os.environ.get("RABBITMQ_DEFAULT_USER", "guest"),
			password=os.environ.get("RABBITMQ_DEFAULT_PASS", "guest"),
		)

		# Attempt to declare the queue passively in case it already exists.
		try:
			self._channel = await self._con.channel()
			self._queue = await self._channel.declare_queue(self.QUEUE, passive=True)
			return self
		except Exception:
			# The server will close the channel on error.
			# Cleanup the reference to it.
			await self._channel.close()

		# The queue does not exist, so actively declare it.
		self._channel = await self._con.channel()
		self._queue = await self._channel.declare_queue(self.QUEUE)
		return self

	async def __aexit__(self, exc_type, exc_value, exc_tb):
		await self._channel.close()
		await self._con.close()
