from logging import getLogger
from watchfiles import awatch, Change

from .publisher import Publisher

logger = getLogger(__name__)


async def monitor(path: str, publisher: Publisher):
	async for changes in awatch(path, ignore_permission_denied=True):
		for event, file in changes:
			if event == Change.added:
				await publisher.add(file)
			elif event == Change.deleted:
				await publisher.delete(file)
			elif event == Change.modified:
				pass
			else:
				logger.info(f"Change {event} occured for file {file}")
