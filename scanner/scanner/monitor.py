import logging
from watchfiles import awatch, Change
from .utils import ProviderError
from .scanner import Scanner


async def monitor(path: str, scanner: Scanner):
	async for changes in awatch(path):
		for (event, file) in changes:
			try:
				if event == Change.added:
					await scanner.identify(file)
				elif event == Change.deleted:
					await scanner.delete(file);
				elif event == Change.modified:
					pass
				else:
					print(f"Change {event} occured for file {file}")
			except ProviderError as e:
				logging.error(str(e))
			except Exception as e:
				logging.exception("Unhandled error", exc_info=e)
