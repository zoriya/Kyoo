async def main():
	import logging
	from autosync.services.simkl import Simkl
	from autosync.services.aggregate import Aggregate
	from autosync.consumer import Consumer

	logging.basicConfig(level=logging.INFO)

	service = Aggregate([Simkl()])
	async with Consumer() as consumer:
		await consumer.listen(service)
