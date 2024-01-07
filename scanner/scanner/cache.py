import asyncio
from datetime import datetime, timedelta
from functools import wraps
from typing import Any, Optional, Tuple

type Cache = dict[Any, Tuple[Optional[asyncio.Event], Optional[datetime], Any]]

def cache(ttl: timedelta, cache: Optional[Cache] = None, typed=False):
	"""
	A cache decorator for async methods. If the same method is called twice with
	the same args, the underlying method will only be called once and the first
	result will be cached.

	Args:
		typed: same as functools.lru_cache
		ttl: how many time should the cached value be considered valid?

	"""

	if cache is None:
		cache = {}

	def wrap(f):
		@wraps(f)
		async def wrapper(*args, **kwargs):
			key = make_key(args, kwargs, typed)

			ret = cache.get(key, (None, None, None))
			# First check if the same method is already running and wait for it.
			if ret[0] is not None:
				await ret[0].wait()
				ret = cache.get(key, (None, None, None))
				if ret[2] is None:
					# ret[2] can be None if the cached method failed. if that is the case, run again.
					return await wrapper(*args, **kwargs)
				return ret[2]
			# Return the cached result if it exits and is not expired
			if (
				ret[2] is not None
				and ret[1] is not None
				and datetime.now() - ret[1] < ttl
			):
				return ret[2]

			return await exec_as_cache(cache, key, lambda: f(*args, **kwargs))

		return wrapper

	return wrap

async def exec_as_cache(cache: Cache, key, f):
	event = asyncio.Event()
	cache[key] = (event, None, None)
	try:
		result = await f()
	except:
		del cache[key]
		event.set()
		raise

	cache[key] = (None, datetime.now(), result)
	event.set()
	return result


# Code bellow was stolen from https://github.com/python/cpython/blob/3.12/Lib/functools.py#L432


class _HashedSeq(list):
	"""This class guarantees that hash() will be called no more than once
	per element.  This is important because the lru_cache() will hash
	the key multiple times on a cache miss.

	"""

	__slots__ = "hashvalue"

	def __init__(self, tup, hash=hash):
		self[:] = tup
		self.hashvalue = hash(tup)

	def __hash__(self):
		return self.hashvalue


def make_key(
	args,
	kwds={},
	typed=False,
	kwd_mark=(object(),),
	fasttypes={int, str},
	tuple=tuple,
	type=type,
	len=len,
):
	"""Make a cache key from optionally typed positional and keyword arguments

	The key is constructed in a way that is flat as possible rather than
	as a nested structure that would take more memory.

	If there is only a single argument and its data type is known to cache
	its hash value, then that argument is returned without a wrapper.  This
	saves space and improves lookup speed.

	"""
	# All of code below relies on kwds preserving the order input by the user.
	# Formerly, we sorted() the kwds before looping.  The new way is *much*
	# faster; however, it means that f(x=1, y=2) will now be treated as a
	# distinct call from f(y=2, x=1) which will be cached separately.
	key = args
	if kwds:
		key += kwd_mark
		for item in kwds.items():
			if isinstance(item[1], list):
				item = (item[0], tuple(item[1]))
			key += item
	if typed:
		key += tuple(type(v) for v in args)
		if kwds:
			key += tuple(type(v) for v in kwds.values())
	elif len(key) == 1 and type(key[0]) in fasttypes:
		return key[0]
	return _HashedSeq(key)
