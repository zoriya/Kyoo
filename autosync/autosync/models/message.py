from dataclasses import dataclass

from autosync.models.episode import Episode
from autosync.models.movie import Movie
from autosync.models.show import Show
from autosync.models.user import User
from autosync.models.watch_status import WatchStatus


@dataclass
class WatchStatusMessage(WatchStatus):
	user: User
	resource: Movie | Show | Episode


@dataclass
class Message:
	action: str
	type: str
	value: WatchStatusMessage
