from itertools import zip_longest
from logging import getLogger
from typing import Awaitable, Callable, Literal

from .guess.guess import guessit
from .models.videos import Guess, Video

logger = getLogger(__name__)

pipeline: list[Callable[[str, Guess], Awaitable[Guess]]] = [
	# TODO: add nfo scanner
	# TODO: add thexem
	# TODO: add anilist
]


async def identify(path: str) -> Video:
	raw = guessit(path, expected_titles=[])

	# guessit should only return one (according to the doc)
	title: str = raw.get("title", [])[0]
	kind: Literal["movie"] | Literal["episode"] = raw.get("type", [])[0]
	version: int = raw.get("version", [])[0]
	# apparently guessit can return multiples but tbh idk what to do with
	# multiples part. we'll just ignore them for now
	part: int = raw.get("part", [])[0]

	years: list[int] = raw.get("year", [])
	seasons: list[int] = raw.get("season", [])
	episodes: list[int] = raw.get("episode", [])

	guess = Guess(
		title=title,
		kind=kind,
		extraKind=None,
		years=years,
		episodes=[
			Guess.Episode(season=s, episode=e)
			for s, e in zip_longest(
				seasons,
				episodes,
				fillvalue=seasons[-1] if len(seasons) < len(episodes) else episodes[-1],
			)
		],
		# TODO: add external ids parsing in guessit
		external_id={},
		from_="guessit",
		raw=raw,
	)

	for step in pipeline:
		try:
			guess = await step(path, guess)
		except Exception as e:
			logger.error("Couldn't run %s.", step.__name__, exc_info=e)

	return Video(
		path=path,
		rendering="",
		part=part,
		version=version,
		guess=guess,
	)
