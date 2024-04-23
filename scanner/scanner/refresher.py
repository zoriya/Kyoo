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
		await asyncio.gather(*(publisher.refresh(**x) for x in todo))
