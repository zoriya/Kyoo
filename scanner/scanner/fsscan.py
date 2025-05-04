import os
import re
import asyncio
from typing import Optional
from logging import getLogger

from .client import KyooClient

logger = getLogger(__name__)


def get_ignore_pattern():
	try:
		pattern = os.environ.get("LIBRARY_IGNORE_PATTERN")
		return re.compile(pattern) if pattern else None
	except re.error as e:
		logger.error(f"Invalid ignore pattern. Ignoring. Error: {e}")
		return None


ignore_pattern = get_ignore_pattern()


async def scan(path: Optional[str], client: KyooClient, remove_deleted=False):
	path = path or os.environ.get("SCANNER_LIBRARY_ROOT", "/video")
	logger.info("Starting scan at %s. This may take some time...", path)
	if ignore_pattern:
		logger.info(f"Applying ignore pattern: {ignore_pattern}")

	info = await client.get_videos_info()

	videos = set()
	for dirpath, dirnames, files in os.walk(path):
		# Skip directories with a `.ignore` file
		if ".ignore" in files:
			# Prevents os.walk from descending into this directory
			dirnames.clear()
			continue

		for file in files:
			file_path = os.path.join(dirpath, file)
			# Apply ignore pattern, if any
			if ignore_pattern and ignore_pattern.match(file_path):
				continue
			videos.add(file_path)

	to_register = videos - info.paths
	to_delete = info.paths - videos if remove_deleted else set()

	if not any(to_register) and any(to_delete) and len(to_delete) == len(info.paths):
		logger.warning("All video files are unavailable. Check your disks.")
		return

	# delete stale files before creating new ones to prevent potential conflicts
	if to_delete:
		logger.info("Removing %d stale files.", len(to_delete))
		await client.delete_videos(to_delete)

	if to_register:
		logger.info("Found %d new files to register.", len(to_register))
		await asyncio.gather(*[publisher.add(path) for path in to_register])

	logger.info("Scan finished for %s.", path)
