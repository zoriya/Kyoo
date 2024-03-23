from dataclasses import dataclass
from dataclasses_json import dataclass_json, LetterCase

from autosync.models.episode import Episode
from autosync.models.movie import Movie
from autosync.models.show import Show
from autosync.models.user import User
from autosync.models.watch_status import WatchStatus


@dataclass_json(letter_case=LetterCase.CAMEL)
@dataclass
class WatchStatusMessage(WatchStatus):
	user: User
	resource: Movie | Show | Episode


@dataclass_json(letter_case=LetterCase.CAMEL)
@dataclass
class Message:
	action: str
	type: str
	value: WatchStatusMessage
