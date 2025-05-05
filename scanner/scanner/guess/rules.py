# Read that for examples/rules: https://github.com/pymedusa/Medusa/blob/master/medusa/name_parser/rules/rules.py

from logging import getLogger
from typing import Any, List, Optional, cast
from rebulk import Rule, RemoveMatch, AppendMatch, POST_PROCESS
from rebulk.match import Matches, Match
from copy import copy

logger = getLogger(__name__)


class UnlistTitles(Rule):
	"""Join titles to a single string instead of a list

	Example: '/media/series/Demon Slayer - Kimetsu no Yaiba/Season 4/Demon Slayer - Kimetsu no Yaiba - S04E10 - Love Hashira Mitsuri Kanroji WEBDL-1080p.mkv'
	Default:
	```json
	 {
		"title": [
			"Demon Slayer",
			"Kimetsu no Yaiba"
		],
		"season": 4,
		"episode_title": "Demon Slayer",
		"alternative_title": "Kimetsu no Yaiba",
		"episode": 10,
		"source": "Web",
		"screen_size": "1080p",
		"container": "mkv",
		"mimetype": "video/x-matroska",
		"type": "episode"
	}
	```
	Expected:
	```json
	{
		"title": "Demon Slayer - Kimetsu no Yaiba",
		"season": 4,
		"episode_title": "Demon Slayer",
		"alternative_title": "Kimetsu no Yaiba",
		"episode": 10,
		"source": "Web",
		"screen_size": "1080p",
		"container": "mkv",
		"mimetype": "video/x-matroska",
		"type": "episode"
	}
	```
	"""

	priority = POST_PROCESS
	consequence = [RemoveMatch, AppendMatch]

	def when(self, matches: Matches, context) -> Any:
		fileparts: List[Match] = matches.markers.named("path")  # type: ignore

		for part in fileparts:
			titles: List[Match] = matches.range(
				part.start, part.end, lambda x: x.name == "title"
			)  # type: ignore

			if not titles or len(titles) <= 1:
				continue

			title = copy(titles[0])
			for nmatch in titles[1:]:
				# Check if titles are next to each other, if they are not ignore it.
				next: List[Match] = matches.next(title)  # type: ignore
				if not next or next[0] != nmatch:
					logger.warn(f"Ignoring potential part of title: {nmatch.value}")
					continue
				title.end = nmatch.end

			return [titles, [title]]


class MultipleSeasonRule(Rule):
	"""Understand `abcd Season 2 - 5.mkv` as S2E5

	Example: '[Erai-raws] Spy x Family Season 2 - 08 [1080p][Multiple Subtitle][00C44E2F].mkv'
	Default:
	```json
	{
		"title": "Spy x Family",
		"season": [
				2,
				3,
				4,
				5,
				6,
				7,
				8
		],
	}
	```
	Expected:
	```json
	{
		"title": "Spy x Family",
		"season": 2,
		"episode": 8,
	}
	```
	"""

	priority = POST_PROCESS
	consequence = [RemoveMatch, AppendMatch]

	def when(self, matches: Matches, context) -> Any:
		seasons: List[Match] = matches.named("season")  # type: ignore

		if not seasons:
			return

		# Only apply this rule if all seasons are due to the same match
		initiator: Optional[Match] = seasons[0].initiator
		if not initiator or any(
			True for match in seasons if match.initiator != initiator
		):
			return

		value: str = initiator.value  # type: ignore
		if "-" not in value:
			return

		new_season, *new_episodes = (x.strip() for x in value.split("-"))
		to_remove = [x for x in seasons if cast(Match, x.parent).value != new_season]
		to_add = []

		try:
			episodes = [int(x) for x in new_episodes]
			parents: List[Match] = [match.parent for match in to_remove]  # type: ignore
			for episode in episodes:
				smatch = next(
					x
					for x in parents
					if int(str(x.value).replace("-", "").strip()) == episode
				)
				match = copy(smatch)
				match.name = "episode"
				match.value = episode
				to_add.append(match)
		except (ValueError, StopIteration):
			return

		return [to_remove, to_add]


class SeasonYearDedup(Rule):
	"""Remove "season" when it's the same as "year"

	Example: "One Piece (1999) 152.mkv"
	Default:
	```json
	{
		"title": "One Piece",
		"year": 1999,
		"season": 1999,
		"episode": 152,
		"container": "mkv",
		"mimetype": "video/x-matroska",
		"type": "episode"
	}
	```
	Expected:
	```json
	{
		"title": "One Piece",
		"year": 1999,
		"episode": 152,
		"container": "mkv",
		"mimetype": "video/x-matroska",
		"type": "episode"
	}
	```
	"""

	# This rules does the opposite of the YearSeason rule of guessit (with POST_PROCESS priority)
	# To overide it, we need the -1. (rule: https://github.com/guessit-io/guessit/blob/develop/guessit/rules/processors.py#L195)
	priority = POST_PROCESS - 1
	consequence = RemoveMatch

	def when(self, matches: Matches, context) -> Any:
		season: List[Match] = matches.named("season")  # type: ignore
		year: List[Match] = matches.named("year")  # type: ignore
		if len(season) == 1 and len(year) == 1 and season[0].value == year[0].value:
			return season
