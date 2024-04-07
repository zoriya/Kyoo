from logging import getLogger

logger = getLogger(__name__)

async def scan(path: str):
	logger.info("Starting the scan. It can take some times...")
	registered = await _get_registered_paths()
	self.issues = await self.get_issues()
	videos = [str(p) for p in Path(path).rglob("*") if p.is_file()]
	deleted = [x for x in self.registered if x not in videos]

		# try:
		# 	self._ignore_pattern = re.compile(
		# 		os.environ.get("LIBRARY_IGNORE_PATTERN", "")
		# 	)
		# except Exception as e:
		# 	self._ignore_pattern = re.compile("")
		# 	logging.error(f"Invalid ignore pattern. Ignoring. Error: {e}")

	if len(deleted) != len(self.registered):
		for x in deleted:
			await self.delete(x)
		for x in self.issues:
			if x not in videos:
				await self.delete(x, "issue")
	elif len(deleted) > 0:
		logging.warning("All video files are unavailable. Check your disks.")

	# We batch videos by 20 because too mutch at once kinda DDOS everything.
	for group in batch(iter(videos), 20):
		await asyncio.gather(*map(self.identify, group))
	logging.info("Scan finished.")
