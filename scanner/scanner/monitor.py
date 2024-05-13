from logging import getLogger
from os.path import isdir
from watchfiles import awatch, Change
from .publisher import Publisher
from .scanner import scan, get_ignore_pattern
from providers.kyoo_client import KyooClient

logger = getLogger(__name__)


async def monitor(path: str, publisher: Publisher, client: KyooClient):
	ignore_pattern = get_ignore_pattern()
	async for changes in awatch(path, ignore_permission_denied=True):
		for event, file in changes:
			if ignore_pattern.match(file):
				logger.info(
					"Ignoring event %s for file %s (due to IGNORE_PATTERN)", event, file
				)
				continue
			logger.info("Change %s occured for file %s", event, file)
			match event:
				case Change.added if isdir(file):
					await scan(file, publisher, client)
				case Change.added:
					await publisher.add(file)
				case Change.deleted:
					await publisher.delete(file)
				case Change.modified:
					pass
				case _:
					logger.warn("Unknown file event %s (for file %s)", event, file)
