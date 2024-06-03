#!/usr/bin/env python3

if __name__ == "__main__":
	import sys
	from pathlib import Path

	sys.path.append(str(Path(f"{__file__}/../../..").resolve()))

from guessit.api import default_api
from typing import cast, List, Any
from rebulk import Rebulk

try:
	from . import rules
except:
	import rules

default_api.configure({})
rblk = cast(Rebulk, default_api.rebulk)
rblk.rules(rules)


def guessit(name: str, *, xem_titles: List[str] = [], extra_flags: dict[str, Any] = {}):
	return default_api.guessit(
		name,
		{
			"episode_prefer_number": True,
			"excludes": "language",
			"expected_title": xem_titles,
		}
		| extra_flags,
	)


# Only used to test localy
if __name__ == "__main__":
	import sys
	import json
	from providers.implementations.thexem import TheXemClient
	from guessit.jsonutils import GuessitEncoder
	from aiohttp import ClientSession
	import asyncio

	async def main():
		async with ClientSession() as client:
			xem = TheXemClient(client)

			advanced = any(x == "-a" for x in sys.argv)
			ret = guessit(
				sys.argv[1],
				xem_titles=await xem.get_expected_titles(),
				extra_flags={"advanced": advanced},
			)
			print(json.dumps(ret, cls=GuessitEncoder, indent=4))

	asyncio.run(main())
