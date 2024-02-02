# Read that for examples/rules: https://github.com/pymedusa/Medusa/blob/master/medusa/name_parser/rules/rules.py

from typing import Any
from rebulk import Rule, RemoveMatch, AppendMatch, POST_PROCESS
from rebulk.match import Matches


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
	        "title": "Spy x Family Season 2",
	        "season": null,
	        "episode": 8,
	        "screen_size": "1080p",
	        "release_group": "Multiple Subtitle",
	        "crc32": "00C44E2F",
	        "container": "mkv",
	        "mimetype": "video/x-matroska",
	        "type": "episode"
	}
	```

	We want `Season 2 ` to be parsed as part of the title since this format is
	often used for animes (where season often does not match, we use thexem for that)
	"""

	priority = POST_PROCESS
	consequence = [RemoveMatch, AppendMatch]

	def when(self, matches: Matches, context) -> Any:
		seasons = matches.named("season")
		print(seasons)
		print(seasons[0])
		print(vars(seasons[0]))
		print(seasons[0].initiator)
		return
