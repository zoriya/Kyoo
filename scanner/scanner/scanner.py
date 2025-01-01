import os
import re
import asyncio
from typing import Optional
from logging import getLogger

from .publisher import Publisher
from providers.kyoo_client import KyooClient

logger = getLogger(__name__)


def get_ignore_pattern():
	"""Compile ignore pattern from environment variable."""
	try:
		pattern = os.environ.get("LIBRARY_IGNORE_PATTERN")
		return re.compile(pattern) if pattern else None
	except re.error as e:
		logger.error(f"Invalid ignore pattern. Ignoring. Error: {e}")
		return None


async def scan(
	path_: Optional[str], publisher: Publisher, client: KyooClient, remove_deleted=False
):
	path = path_ or os.environ.get("SCANNER_LIBRARY_ROOT", "/video")
	logger.info("Starting scan at %s. This may take some time...", path)

	ignore_pattern = get_ignore_pattern()
	if ignore_pattern:
		logger.info(f"Applying ignore pattern: {ignore_pattern}")

	registered = set(await client.get_registered_paths())
	videos = set()

	for dirpath, dirnames, files in os.walk(path):
		# Skip directories with a `.ignore` file
		if ".ignore" in files:
			dirnames.clear()  # Prevents os.walk from descending into this directory
			continue

		for file in files:
			file_path = os.path.join(dirpath, file)
			# Apply ignore pattern, if any
			if ignore_pattern and ignore_pattern.match(file_path):
				continue
			videos.add(file_path)

	to_register = videos - registered
	to_delete = registered - videos if remove_deleted else set()

	if not any(to_register) and any(to_delete) and len(to_delete) == len(registered):
		logger.warning("All video files are unavailable. Check your disks.")
		return

	# delete stale files before creating new ones to prevent potential conflicts
	if to_delete:
		logger.info("Removing %d stale files.", len(to_delete))
		await asyncio.gather(*[publisher.delete(path) for path in to_delete])

	if to_register:
		logger.info("Found %d new files to register.", len(to_register))
		await asyncio.gather(*[publisher.add(path) for path in to_register])

	if remove_deleted:
		issues = set(await client.get_issues())
		issues_to_delete = issues - videos
		if issues_to_delete:
			logger.info("Removing %d stale issues.", len(issues_to_delete))
			await asyncio.gather(
				*[client.delete_issue(issue) for issue in issues_to_delete]
			)

	logger.info("Scan finished for %s.", path)
