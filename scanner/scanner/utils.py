import logging
from functools import wraps
from itertools import islice
from typing import Iterator, List, TypeVar
from providers.utils import ProviderError


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


def log_errors(f):
	@wraps(f)
	async def internal(*args, **kwargs):
		try:
			await f(*args, **kwargs)
		except ProviderError as e:
			logging.error(str(e))
		except Exception as e:
			logging.exception("Unhandled error", exc_info=e)

	return internal
