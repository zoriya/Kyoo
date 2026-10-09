# Read that for examples/rules: https://github.com/pymedusa/Medusa/blob/master/medusa/name_parser/rules/rules.py

import re
from copy import copy
from logging import getLogger
from typing import Any, cast, override

from guessit.rules.properties.title import TitleFromPosition
from rebulk import POST_PROCESS, AppendMatch, RemoveMatch, RenameMatch, Rule
from rebulk.match import Match, Matches

logger = getLogger(__name__)


class DirectoryTitleNumber(Rule):
	"""Remove episode numbers already part of a directory's title

	guessit's `TitleToEpisodeTitle` converts titles that follow an episode number to an
	episode_title, so the `100` of the directory would make the filename's title an episode_title.
	This needs to run before it (same dependency & we're loaded first).

	Example: '/media/Zom 100/[Erai-raws] Zom 100 - Zombie ni Naru made ni Shitai 100 no Koto - 01 [1080p][Multiple Subtitle][8AFBB298].mkv'
	Default:
	```json
	{
		"title": "Zom 100",
		"episode_title": "Zom 100 - Zombie ni Naru made ni Shitai",
		"episode": [100, 1],
	}
	```
	Expected:
	```json
	{
		"title": "Zom 100",
		"episode_title": "Zombie ni Naru made ni Shitai 100 no Koto",
		"episode": 1,
	}
	```
	"""

	dependency = TitleFromPosition
	consequence = RemoveMatch

	@override
	def when(self, matches: Matches, context) -> Any:
		fileparts: list[Match] = matches.markers.named("path")  # type: ignore

		to_remove = []
		for part in fileparts[:-1]:
			for title in matches.range(
				part.start, part.end, lambda x: x.name == "title"
			):
				to_remove += matches.range(
					title.start,
					title.end,
					lambda x: x.name == "episode" and x.tagged("weak-episode"),
				)
		return to_remove


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

	@override
	def when(self, matches: Matches, context) -> Any:
		fileparts: list[Match] = matches.markers.named("path")  # type: ignore

		for part in fileparts:
			titles: list[Match] = matches.range(
				part.start, part.end, lambda x: x.name == "title"
			)  # type: ignore

			if not titles or len(titles) <= 1:
				continue

			title = copy(titles[0])
			for nmatch in titles[1:]:
				# Check if titles are next to each other, if they are not ignore it.
				next: list[Match] = matches.next(title)  # type: ignore
				if not next or next[0] != nmatch:
					logger.warning(f"Ignoring potential part of title: {nmatch.value}")
					continue
				title.end = nmatch.end

			return [titles, [title]]


class OrdinalSeasonRule(Rule):
	"""Parse ordinal season patterns like "2nd Season" from the title.

	Example: '[Erai-raws] Oshi no Ko 2nd Season - 12 [1080p AMZN WEB-DL AVC EAC3][MultiSub][CB69AB71].mkv'
	Default:
	```json
	{
		"title": "Oshi no Ko 2nd Season",
		"season": 1,
		"episode": 12
	}
	```
	Expected:
	```json
	{
		"title": "Oshi no Ko",
		"season": 2,
		"episode": 12
	}
	```
	"""

	priority = POST_PROCESS
	consequence = [RemoveMatch, AppendMatch]

	ORDINAL_SEASON_RE = re.compile(
		r"(\d+)\s*(?:st|nd|rd|th)\s+season",
		re.IGNORECASE,
	)

	@override
	def when(self, matches: Matches, context) -> Any:
		titles: list[Match] = matches.named("title")  # type: ignore

		to_remove = []
		to_add = []

		for title in titles:
			title_value = str(title.value)
			m = self.ORDINAL_SEASON_RE.search(title_value)
			if not m:
				continue

			to_remove.append(title)
			new_title = copy(title)
			new_title.value = title_value[: m.start()].strip()
			to_add.append(new_title)

			season = copy(title)
			season.name = "season"
			season.start += m.start()
			season.value = int(m.group(1))
			to_add.append(season)
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

	@override
	def when(self, matches: Matches, context) -> Any:
		seasons: list[Match] = matches.named("season")  # type: ignore

		if not seasons:
			return

		# Only apply this rule if all seasons are due to the same match
		initiator: Match | None = seasons[0].initiator
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
			parents: list[Match] = [match.parent for match in to_remove]  # type: ignore
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


class PreferFilenameOverDirectory(Rule):
	"""When a property is found in both the filename and a parent directory, prefer the filename.

	Example: '/media/Dark/Dark (2017) Season 1-3 S01-S03 (1080p NF WEB-DL x265 HEVC 10bit EAC3 5.1 German Ghost)/Season 2/Dark (2017) - S02E05 - Lost and Found (1080p NF WEB-DL x265 Ghost).mkv'
	Default:
	```json
	{
		"title": "Dark",
		"season": [1, 2, 3],
		"episode": 5,
	}
	```
	Expected:
	```json
	{
		"title": "Dark",
		"season": 2,
		"episode": 5,
	}
	```
	"""

	priority = POST_PROCESS
	# rename to prevent them from being merged to other guesses
	consequence = RenameMatch("removed")

	@override
	def when(self, matches: Matches, context) -> Any:
		fileparts: list[Match] = matches.markers.named("path")  # type: ignore

		if len(fileparts) < 2:
			return

		filename = fileparts[-1]

		to_remove = []
		for prop in {"season", "episode", "title"}:
			all_matches: list[Match] = matches.named(prop)  # type: ignore
			if not all_matches:
				continue

			filename_matches = [
				m
				for m in all_matches
				if m.start >= filename.start and m.end <= filename.end
			]
			directory_matches = [m for m in all_matches if m.start < filename.start]
			if filename_matches and directory_matches:
				to_remove.extend(directory_matches)

		return to_remove if to_remove else None


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

	@override
	def when(self, matches: Matches, context) -> Any:
		episodes: List[Match] = matches.named("episode")  # type: ignore

		if len(episodes) < 2 or all(x.value == episodes[0].value for x in episodes):
			return

		to_remove = []
		to_add = []
		for episode in episodes:
			prevs: List[Match] = matches.previous(episode)  # type: ignore
			title = prevs[0] if prevs and prevs[0].tagged("title") else None
			if not title:
				continue

			# do not fixup if there was a - or any separator between the title and the episode number
			hole: List[Match] = matches.holes(title.end, episode.start)  # type: ignore
			if hole:
				continue

			to_remove.extend([title, episode])
			new_title = copy(title)
			new_title.end = episode.end

			nmatch: List[Match] = matches.next(episode)  # type: ignore
			if nmatch:
				end = (
					nmatch[0].initiator.start
					if isinstance(nmatch[0].initiator, Match)
					else nmatch[0].start
				)
				# If an hole was created to parse the episode at the current pos, merge it back into the title
				holes: List[Match] = matches.holes(start=episode.end, end=end)  # type: ignore
				if holes and holes[0].start == episode.end:
					new_title.end = holes[0].end

			to_add.append(new_title)
		return [to_remove, to_add]


class ExpectedTitles(Rule):
	"""Fix both alternate names and seasons that are known titles but parsed differently by guessit

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

	But the title should not absorb the only episode number of the file
	Example: '[SubsPlease] Oshi no Ko - 02 (1080p).mkv' (with `Oshi no Ko 2` as an expected title)
	Expected:
	```json
	{
		"title": "Oshi no Ko",
		"episode": 2
	}
	```

	Or
	Example: '[Erai-raws] JoJo no Kimyou na Bouken - Steel Ball Run - 01 [1080p NF WEBRip HEVC AAC][MultiSub][3C988D2A].mkv'
	Default:
	```json
	{
		"title": "JoJo no Kimyou na Bouken",
		"episode_title": "Steel Ball Run",
		"episode": 1
	}
	```
	Expected:
	```json
	{
		"title": "Steel Ball Run JoJo no Kimyou na Bouken",
		"episode": 1
	}
	```
	"""

	priority = POST_PROCESS
	consequence = [RemoveMatch, AppendMatch]

	@override
	def when(self, matches: Matches, context) -> Any:
		from ..anilist import normalize_title

		titles: list[Match] = matches.named("title", lambda m: m.tagged("title"))

		if not titles or not context or not context["expected_titles"]:
			return
		title = titles[0]

		# Greedily collect all adjacent matches that could be part of the title
		absorbed: list[Match] = []
		current = title
		while True:
			nmatch: list[Match] = matches.next(current)
			if not nmatch or not (
				nmatch[0].tagged("title")
				or nmatch[0].named("episode_title")
				or nmatch[0].named("season")
				or nmatch[0].named("episode")
				or nmatch[0].named("part")
				or nmatch[0].named("year")
			):
				break
			absorbed.append(nmatch[0])
			current = nmatch[0]
		if not absorbed:
			return

		# Try longest combined title first, then progressively shorter ones
		for end in range(len(absorbed), 0, -1):
			candidate_matches = absorbed[:end]

			# `Oshi no Ko - 02` is the episode 2, not the title `Oshi no Ko 2` without episode.
			# seasons are also accepted since `Season 3 - 12` is still parsed as a range of seasons here.
			if any(m.named("episode") for m in candidate_matches) and not matches.range(
				candidate_matches[-1].end,
				len(matches.input_string or ""),
				lambda m: m.name in ("episode", "season"),
			):
				continue

			mtitle = f"{title.value}"
			prev = title
			for m in candidate_matches:
				holes: list[Match] = matches.holes(prev.end, m.start)  # type: ignore
				hole = (
					"".join(f" {h.value}" if h.value != "-" else " - " for h in holes)
					or " "
				)
				mtitle = f"{mtitle}{hole}{m.value}"
				prev = m

			# releases sometimes swap the parts (`JoJo no Kimyou na Bouken - Steel Ball Run`
			# for `Steel Ball Run: JoJo no Kimyou na Bouken`)
			swapped = f"{mtitle[len(str(title.value)) :].strip(' -')} {title.value}"
			for value in [mtitle, swapped]:
				if normalize_title(value) in context["expected_titles"]:
					new_title = copy(title)
					new_title.end = candidate_matches[-1].end
					new_title.value = value
					return [[title] + candidate_matches, [new_title]]


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
	# To override it, we need the -1. (rule: https://github.com/guessit-io/guessit/blob/develop/guessit/rules/processors.py#L195)
	priority = POST_PROCESS - 1
	consequence = RemoveMatch

	@override
	def when(self, matches: Matches, context) -> Any:
		season: list[Match] = matches.named("season")  # type: ignore
		year: list[Match] = matches.named("year")  # type: ignore

		to_remove = []
		for y in year:
			to_remove += [x for x in season if x.value == y.value]
		return to_remove
