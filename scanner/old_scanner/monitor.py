from logging import getLogger
from os.path import isdir, dirname, exists, join
from watchfiles import awatch, Change
from .publisher import Publisher
from .scanner import scan, get_ignore_pattern
from providers.kyoo_client import KyooClient

logger = getLogger(__name__)


def is_ignored_path(path: str) -> bool:
	"""Check if the path is within a directory that contains a `.ignore` file."""
	current_path = path
	while current_path != "/":  # Traverse up to the root directory
		if exists(join(current_path, ".ignore")):
			return True
		current_path = dirname(current_path)
	return False


async def monitor(path: str, publisher: Publisher, client: KyooClient):
	ignore_pattern = get_ignore_pattern()
	async for changes in awatch(path, ignore_permission_denied=True):
		for event, file in changes:
			# Check for ignore conditions
			if is_ignored_path(file):
				logger.info(
					"Ignoring event %s for file %s (due to .ignore file)", event, file
				)
				continue
			if ignore_pattern and ignore_pattern.match(file):
				logger.info(
					"Ignoring event %s for file %s (due to IGNORE_PATTERN)", event, file
				)
				continue

			logger.info("Change %s occurred for file %s", event, file)
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
					logger.warning("Unknown file event %s (for file %s)", event, file)
