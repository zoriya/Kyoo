import os
import re
import asyncio
from typing import Optional
from logging import getLogger

from .publisher import Publisher
from providers.kyoo_client import KyooClient

logger = getLogger(__name__)


def get_ignore_pattern():
	try:
		return re.compile(os.environ.get("LIBRARY_IGNORE_PATTERN", ""))
	except Exception as e:
		logger.error(f"Invalid ignore pattern. Ignoring. Error: {e}")
		return re.compile("")


async def scan(
	path_: Optional[str], publisher: Publisher, client: KyooClient, remove_deleted=False
):
	path = path_ or os.environ.get("SCANNER_LIBRARY_ROOT", "/video")

	logger.info("Starting the scan. It can take some times...")
	ignore_pattern = get_ignore_pattern()

	registered = await client.get_registered_paths()
	videos = [
		os.path.join(dir, file) for dir, _, files in os.walk(path) for file in files
	]
	to_register = [
		p for p in videos if p not in registered and not ignore_pattern.match(p)
	]

	if remove_deleted:
		deleted = [x for x in registered if x not in videos]
		logger.info("Found %d stale files to remove.", len(deleted))
		if len(deleted) != len(registered):
			await asyncio.gather(*map(publisher.delete, deleted))
		elif len(deleted) > 0:
			logger.warning("All video files are unavailable. Check your disks.")

		issues = await client.get_issues()
		for x in issues:
			if x not in videos:
				await client.delete_issue(x)

	logger.info("Found %d new files (counting non-video files)", len(to_register))
	await asyncio.gather(*map(publisher.add, to_register))
	logger.info("Scan finished for %s.", path)
