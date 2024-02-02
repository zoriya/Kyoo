#!/usr/bin/env python3

from guessit.api import default_api
from typing import cast
from rebulk import Rebulk

import rules

default_api.configure({})
rblk = cast(Rebulk, default_api.rebulk)
rblk.rules(rules)


def guessit(name: str):
	return default_api.guessit(
		name, {"episode_prefer_number": True, "excludes": "language"}
	)


# Only used to test localy
if __name__ == "__main__":
	import sys
	import json
	from guessit.jsonutils import GuessitEncoder

	ret = guessit(sys.argv[1])
	print(json.dumps(ret, cls=GuessitEncoder, indent=4))
