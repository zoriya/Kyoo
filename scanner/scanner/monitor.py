from logging import getLogger
from os.path import isdir
from watchfiles import awatch, Change
from .publisher import Publisher
from .scanner import scan
from providers.kyoo_client import KyooClient

logger = getLogger(__name__)


async def monitor(path: str, publisher: Publisher, client: KyooClient):
	async for changes in awatch(path, ignore_permission_denied=True):
		for event, file in changes:
			if event == Change.added:
				if isdir(file):
					await scan(file, publisher, client)
				else:
					await publisher.add(file)
			elif event == Change.deleted:
				await publisher.delete(file)
			elif event == Change.modified:
				pass
			else:
				logger.info(f"Change {event} occured for file {file}")
