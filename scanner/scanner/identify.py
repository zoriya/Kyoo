from hashlib import sha256
from itertools import zip_longest
from logging import getLogger
from typing import Awaitable, Callable, Literal, Optional, cast

from .guess.guess import guessit
from .models.videos import Guess, Video

logger = getLogger(__name__)

pipeline: list[Callable[[str, Guess], Awaitable[Guess]]] = [
	# TODO: add nfo scanner
	# TODO: add thexem
	# TODO: add anilist
]


async def identify(path: str) -> Video:
	raw = guessit(
		path,
		expected_titles=[],
		extra_flags={"advanced": True},
	)

	# guessit should only return one (according to the doc)
	title = raw.get("title", [])[0]
	kind = raw.get("type", [])[0]
	version = next(iter(raw.get("version", [])), None)
	# apparently guessit can return multiples but tbh idk what to do with
	# multiples part. we'll just ignore them for now
	part = next(iter(raw.get("part", [])), None)

	years = raw.get("year", [])
	seasons = raw.get("season", [])
	episodes = raw.get("episode", [])

	rendering = path[:version.start] + path[version.end:]

	print(raw)
	guess = Guess(
		title=cast(str, title.value),
		kind=cast(Literal["episode"] | Literal["movie"], kind.value),
		extra_kind=None,
		years=[cast(int, y.value) for y in years],
		episodes=[
			Guess.Episode(season=cast(int, s.value), episode=cast(int, e.value))
			for s, e in zip_longest(
				seasons,
				episodes,
				fillvalue=seasons[-1] if len(seasons) < len(episodes) else episodes[-1],
			)
		],
		external_id={},
		from_="guessit",
		raw={k: [x.value for x in v] for k, v in raw.items()},
	)

	for step in pipeline:
		try:
			guess = await step(path, guess)
		except Exception as e:
			logger.error("Couldn't run %s.", step.__name__, exc_info=e)

	return Video(
		path=path,
		rendering=sha256(path.encode()).hexdigest(),
		part=cast(int, part.value) if part else None,
		version=cast(int, version.value) if version else 1,
		guess=guess,
	)


if __name__ == "__main__":
	import asyncio
	import sys

	async def main():
		ret = await identify(sys.argv[1])
		print(ret.model_dump_json(indent=4, by_alias=True))

	asyncio.run(main())
