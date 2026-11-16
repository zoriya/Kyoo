from asyncio import sleep
from datetime import timedelta
from logging import getLogger

from .client import KyooClient
from .models.metadataid import MetadataId
from .models.request import Request
from .requests import RequestCreator

logger = getLogger(__name__)


class ShowRefresh:
	def __init__(self, client: KyooClient, requests: RequestCreator):
		self._client = client
		self._requests = requests

	async def monitor(self):
		while True:
			try:
				queued = await self.refresh_due_shows()
				logger.info("Queued %d shows for refresh.", queued)
			except Exception as e:
				logger.error("Unexpected error while refreshing shows.", exc_info=e)
			await sleep(timedelta(days=1).total_seconds())

	async def refresh_due_shows(self) -> int:
		queued = 0
		next_url: str | None = None

		while True:
			page = await self._client.get_shows_to_refresh(next_url)
			requests = [
				Request(
					kind="movie" if show.kind == "movie" else "episode",
					title=show.name,
					year=show.air_date.year
					if show.air_date is not None
					else show.start_air.year
					if show.start_air is not None
					else None,
					external_id=MetadataId.map_dict(show.external_id),
					videos=[],
					show_id=show.id,
				)
				for show in page.items
				if show.kind != "collection"
			]
			if requests:
				_ = await self._requests.enqueue(requests)
				queued += len(requests)

			if not page.next:
				break
			next_url = page.next

		return queued
