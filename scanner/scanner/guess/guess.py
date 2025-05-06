from typing import Any, List, cast

from guessit.api import default_api
from rebulk import Rebulk
from rebulk.match import Match

try:
	from . import rules
except:
	import rules

default_api.configure({})
rblk = cast(Rebulk, default_api.rebulk)
rblk.rules(rules)


def guessit(
	name: str,
	*,
	expected_titles: List[str] = [],
	extra_flags: dict[str, Any] = {},
) -> dict[str, list[Match]]:
	return default_api.guessit(
		name,
		{
			"episode_prefer_number": True,
			"excludes": "language",
			"expected_title": expected_titles,
			"enforce_list": True,
			"advanced": True,
		}
		| extra_flags,
	)
