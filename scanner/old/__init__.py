async def main():
	import asyncio
	import os
	import logging
	from .monitor import monitor
	from .scanner import scan
	from .refresher import refresh
	from .publisher import Publisher
	from .subscriber import Subscriber
	from old.kyoo_client import KyooClient

	logging.basicConfig(level=logging.INFO)
	logging.getLogger("watchfiles").setLevel(logging.WARNING)

	async with (
		Publisher() as publisher,
		Subscriber() as subscriber,
		KyooClient() as client,
	):
		path = os.environ.get("SCANNER_LIBRARY_ROOT", "/video")

		async def scan_all():
			await scan(path, publisher, client, remove_deleted=True)

		await asyncio.gather(
			monitor(path, publisher, client),
			scan_all(),
			refresh(publisher, client),
			subscriber.listen(scan_all),
		)
