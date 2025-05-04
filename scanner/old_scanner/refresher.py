import asyncio
from logging import getLogger

from providers.kyoo_client import KyooClient
from scanner.publisher import Publisher


logger = getLogger(__name__)


async def refresh(publisher: Publisher, client: KyooClient):
	while True:
		# Check for updates every 4 hours
		await asyncio.sleep(60 * 60 * 4)
		todo = await client.get("refreshables")
		logger.info("Refreshing %d items", len(todo))
		await asyncio.gather(*(publisher.refresh(**x) for x in todo))
		logger.info("Refresh finish. Will check for new items to refresh in 4 hours")
