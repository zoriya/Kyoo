# Read that for examples/rules: https://github.com/pymedusa/Medusa/blob/master/medusa/name_parser/rules/rules.py

from typing import Any, List, Optional, cast
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
	}
	```
	Expected:
	```json
	{
	        "release_group": "Erai-raws",
	        "title": "Youkoso Jitsuryoku Shijou Shugi no Kyoushitsu e",
	        "season": 3,
	        "episode": 5,
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
	}
	```
	Expected:
	```json
	{
	        "release_group": "Erai-raws",
	        "title": "Zom 100",
	        "episode": 1,
	        "episode_title": "Zombie ni Naru made ni Shitai 100 no Koto",
	}
	```
	"""

	priority = POST_PROCESS
	consequence = [RemoveMatch, AppendMatch]

	def when(self, matches: Matches, context) -> Any:
		episodes: List[Match] = matches.named("episode")  # type: ignore

		if len(episodes) < 2:
			return

		to_remove = []
		to_add = []
		for episode in episodes:
			prevs: List[Match] = matches.previous(episode)  # type: ignore
			title = prevs[0] if prevs and prevs[0].tagged("title") else None
			if not title:
				continue

			# do not fixup if there was a - or any separator between the title and the episode number
			holes = matches.holes(title.end, episode.start)
			if holes:
				continue

			to_remove.extend([title, episode])
			new_title = copy(title)
			new_title.end = episode.end
			new_title.value = f"{title.value} {episode.value}"

			# If an hole was created to parse the episode at the current pos, merge it back into the title
			holes = matches.holes(episode.end)
			if holes and holes[0].start == episode.end:
				val: str = holes[0].value
				if "-" in val:
					val, *_ = val.split("-")
					val = val.rstrip()
				new_title.value = f"{new_title.value}{val}"
				new_title.end += len(val)

			to_add.append(new_title)
		return [to_remove, to_add]


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


class XemFixup(Rule):
	"""Fix both alternate names and seasons that are known on the xem but parsed differently by guessit

	Example: "JoJo's Bizarre Adventure - Diamond is Unbreakable - 12.mkv"
	Default:
	```json
	{
	        "title": "JoJo's Bizarre Adventure",
	        "alternative_title": "Diamond is Unbreakable",
	        "episode": 12,
	}
	```
	Expected:
	```json
	{
	        "title": "JoJo's Bizarre Adventure - Diamond is Unbreakable",
	        "episode": 12,
	}
	```

	Or
	Example: 'Owarimonogatari S2 E15.mkv'
	Default:
	```json
	{
	        "title": "Owarimonogatari",
	        "season": 2,
	        "episode": 15
	}
	```
	Expected:
	```json
	{
	        "title": "Owarimonogatari S2",
	        "episode": 15
	}
	```
	"""

	priority = POST_PROCESS
	consequence = [RemoveMatch, AppendMatch]

	def when(self, matches: Matches, context) -> Any:
		titles: List[Match] = matches.named("title", lambda m: m.tagged("title"))  # type: ignore

		if not titles or not context["xem_titles"]:
			return
		title = titles[0]

		nmatch: List[Match] = matches.next(title)  # type: ignore
		if not nmatch or not (nmatch[0].tagged("title") or nmatch[0].named("season")):
			return

		holes: List[Match] = matches.holes(title.end, nmatch[0].start)  # type: ignore
		hole = " ".join(f" {h.value}" if h.value != "-" else " - " for h in holes)

		new_title = copy(title)
		new_title.end = nmatch[0].end
		new_title.value = f"{title.value}{hole}{nmatch[0].value}"

		if new_title.value.lower().replace(" ", "") in context["xem_titles"]:
			return [[title, nmatch[0]], [new_title]]
