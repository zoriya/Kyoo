import os
import re
import asyncio
from logging import getLogger

from .publisher import Publisher
from providers.kyoo_client import KyooClient

logger = getLogger(__name__)


async def scan(
	path: str, publisher: Publisher, client: KyooClient, remove_deleted=False
):
	logger.info("Starting the scan. It can take some times...")
	ignore_pattern = None
	try:
		ignore_pattern = re.compile(os.environ.get("LIBRARY_IGNORE_PATTERN", ""))
	except Exception as e:
		ignore_pattern = re.compile("")
		logger.error(f"Invalid ignore pattern. Ignoring. Error: {e}")

	registered = await client.get_registered_paths()
	videos = [
		os.path.join(dir, file) for dir, _, files in os.walk(path) for file in files
	]
	to_register = [
		p for p in videos if p not in registered and not ignore_pattern.match(p)
	]

	if remove_deleted:
		deleted = [x for x in registered if x not in videos]
		if len(deleted) != len(registered):
			await asyncio.gather(*map(publisher.delete, deleted))
		elif len(deleted) > 0:
			logger.warning("All video files are unavailable. Check your disks.")

	await asyncio.gather(*map(publisher.add, to_register))
	logger.info(f"Scan finished for {path}.")
