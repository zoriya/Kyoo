async def main():
	import asyncio
	import os
	import logging
	from .monitor import monitor
	from .scanner import scan
	from .publisher import Publisher
	from providers.kyoo_client import KyooClient

	logging.basicConfig(level=logging.INFO)
	logging.getLogger("watchfiles").setLevel(logging.WARNING)

	async with Publisher() as publisher, KyooClient() as client:
		path = os.environ.get("SCANNER_LIBRARY_ROOT", "/video")
		await asyncio.gather(
			monitor(path, publisher),
			scan(path, publisher, client),
		)
