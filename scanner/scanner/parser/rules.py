# Read that for examples/rules: https://github.com/pymedusa/Medusa/blob/master/medusa/name_parser/rules/rules.py

from typing import Any, Generator, Iterable, List, Optional, cast
from rebulk import Rule, RemoveMatch, AppendMatch, POST_PROCESS
from rebulk.match import Matches, Match
from copy import copy


class EpisodeTitlePromotion(Rule):
	"""Promote "episode_title" to "episode" when the title is in fact the episode number

	Example: '[Erai-raws] Youkoso Jitsuryoku Shijou Shugi no Kyoushitsu e S3 - 05 [1080p][Multiple Subtitle][0DDEAFCD].mkv'

	Default:
	```json
	{
	        "release_group": "Erai-raws",
	        "title": "Youkoso Jitsuryoku Shijou Shugi no Kyoushitsu e",
	        "season": 3,
	        "episode_title": "05",
	        "screen_size": "1080p",
	        "subtitle_language": "Multiple languages",
	        "crc32": "0DDEAFCD",
	        "container": "mkv",
	        "mimetype": "video/x-matroska",
	        "type": "episode"
	}
	```

	Expected:
	```json
	{
	        "release_group": "Erai-raws",
	        "title": "Youkoso Jitsuryoku Shijou Shugi no Kyoushitsu e",
	        "season": 3,
	        "episode": 5,
	        "screen_size": "1080p",
	        "subtitle_language": "Multiple languages",
	        "crc32": "0DDEAFCD",
	        "container": "mkv",
	        "mimetype": "video/x-matroska",
	        "type": "episode"
	}
	```
	"""

	priority = POST_PROCESS
	consequence = [RemoveMatch, AppendMatch]

	def when(self, matches: Matches, context) -> Any:
		ep_title: List[Match] = matches.named("episode_title")  # type: ignore
		if not ep_title:
			return

		to_remove = [match for match in ep_title if str(match.value).isdecimal()]
		to_add = []
		for tmatch in to_remove:
			match = copy(tmatch)
			match.name = "episode"
			match.value = int(str(tmatch.value))
			to_add.append(match)
		return [to_remove, to_add]


class TitleNumberFixup(Rule):
	"""Fix titles having numbers in them

	Example: '[Erai-raws] Zom 100 - Zombie ni Naru made ni Shitai 100 no Koto - 01 [1080p][Multiple Subtitle][8AFBB298].mkv'
	     (or '[SubsPlease] Mob Psycho 100 Season 3 - 12 (1080p) [E5058D7B].mkv')

	Default:
	```json
	{
	        "release_group": "Erai-raws",
	        "title": "Zom",
	        "episode": [
	                100,
	                1
	        ],
	        "episode_title": "Zombie ni Naru made ni Shitai",
	        "screen_size": "1080p",
	        "subtitle_language": "Multiple languages",
	        "crc32": "8AFBB298",
	        "container": "mkv",
	        "mimetype": "video/x-matroska",
	        "type": "episode"
	}
	```

	Expected:
	```json
	{
	        "release_group": "Erai-raws",
	        "title": "Zom 100",
	        "episode": 1,
	        "episode_title": "Zombie ni Naru made ni Shitai 100 no Koto",
	        "screen_size": "1080p",
	        "subtitle_language": "Multiple languages",
	        "crc32": "8AFBB298",
	        "container": "mkv",
	        "mimetype": "video/x-matroska",
	        "type": "episode"
	}
	```
	"""

	priority = POST_PROCESS
	consequence = [RemoveMatch, AppendMatch]

	def when(self, matches: Matches, context) -> Any:
		episodes: List[Match] = matches.named("episode")  # type: ignore

		if not episodes or len(episodes) < 2:
			return

		episode = episodes[0]
		prevs: List[Match] = matches.previous(episode)  # type: ignore
		title = prevs[0] if len(prevs) > 0 and prevs[0].name == "title" else None
		if not title:
			return

		# do not fixup if there was a - or any separator between the title and the episode number
		holes = matches.holes(title.end, episode.start)
		if holes:
			return

		newTitle = copy(title)
		newTitle.end = episode.end
		newTitle.value = f"{title.value} {episode.value}"
		return [[title, episode], [newTitle]]


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
