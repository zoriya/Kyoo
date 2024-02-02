# Read that for examples/rules: https://github.com/pymedusa/Medusa/blob/master/medusa/name_parser/rules/rules.py

from typing import Any, List, Optional, cast
from rebulk import Rule, RemoveMatch, AppendMatch, POST_PROCESS
from rebulk.match import Matches, Match
from copy import copy


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
	        "screen_size": "1080p",
	        "release_group": "Multiple Subtitle",
	        "crc32": "00C44E2F",
	        "container": "mkv",
	        "mimetype": "video/x-matroska",
	        "type": "episode"
	}
	```

	Expected:
	```json
	{
	        "title": "Spy x Family",
	        "season": 2,
	        "episode": 8,
	        "screen_size": "1080p",
	        "release_group": "Multiple Subtitle",
	        "crc32": "00C44E2F",
	        "container": "mkv",
	        "mimetype": "video/x-matroska",
	        "type": "episode"
	}
	```
	"""

	priority = POST_PROCESS
	consequence = [RemoveMatch, AppendMatch]

	def when(self, matches: Matches, context) -> Any:
		seasons: List[Match] = matches.named("season")  # type: ignore

		if not seasons or len(seasons) < 1:
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

		newSeason, *newEpisodes = (x.strip() for x in value.split("-"))
		to_remove = [x for x in seasons if cast(Match, x.parent).value != newSeason]
		to_add = []

		try:
			episodes = [int(x) for x in newEpisodes]
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
