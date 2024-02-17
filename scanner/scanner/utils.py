from __future__ import annotations
import logging
from functools import wraps
from itertools import islice
from typing import TYPE_CHECKING, Iterator, List, TypeVar
from providers.utils import ProviderError

if TYPE_CHECKING:
	from scanner.scanner import Scanner


T = TypeVar("T")


def batch(iterable: Iterator[T], n: int) -> Iterator[List[T]]:
	"Batch data into lists of length n. The last batch may be shorter."
	# batched('ABCDEFG', 3) --> ABC DEF G
	it = iter(iterable)
	while True:
		batch = list(islice(it, n))
		if not batch:
			return
		yield batch


def handle_errors(f):
	@wraps(f)
	async def internal(self: Scanner, path: str):
		try:
			await f(self, path)
			if path in self.issues:
				await self._client.delete(
					f'{self._url}/issues?filter=domain eq scanner and cause eq "{path}"',
					headers={"X-API-Key": self._api_key},
				)
		except ProviderError as e:
			logging.error(str(e))
			await self._client.post(
				f"{self._url}/issues",
				json={"domain": "scanner", "cause": path, "reason": str(e)},
				headers={"X-API-Key": self._api_key},
			)
		except Exception as e:
			logging.exception("Unhandled error", exc_info=e)
			await self._client.post(
				f"{self._url}/issues",
				json={
					"domain": "scanner",
					"cause": path,
					"reason": "Unknown error",
					"extra": {"type": type(e).__name__, "message": str(e)},
				},
				headers={"X-API-Key": self._api_key},
			)

	return internal
