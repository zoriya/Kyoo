import asyncio
import logging
from functools import wraps
from providers.utils import ProviderError


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


cache = {}


def provider_cache(*args):
	ic = cache
	for arg in args:
		if arg not in ic:
			ic[arg] = {}
		ic = ic[arg]

	def wrapper(f):
		@wraps(f)
		async def internal(*args, **kwargs):
			nonlocal ic
			for arg in args:
				if arg not in ic:
					ic[arg] = {}
				ic = ic[arg]

			if "event" in ic:
				await ic["event"].wait()
				if "ret" not in ic:
					raise ProviderError("Cache miss. Another error should exist")
				return ic["ret"]
			ic["event"] = asyncio.Event()
			try:
				ret = await f(*args, **kwargs)
				ic["ret"] = ret
			except:
				ic["event"].set()
				raise
			ic["event"].set()
			return ret

		return internal

	return wrapper


def set_in_cache(key: list[str | int]):
	ic = cache
	for arg in key:
		if arg not in ic:
			ic[arg] = {}
		ic = ic[arg]
	evt = asyncio.Event()
	evt.set()
	ic["event"] = evt
