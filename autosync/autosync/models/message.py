from msgspec import Struct
from autosync.models.episode import Episode
from autosync.models.movie import Movie
from autosync.models.show import Show
from autosync.models.user import User
from autosync.models.watch_status import WatchStatus


class WatchStatusMessage(WatchStatus):
	user: User
	resource: Movie | Show | Episode


class Message(Struct, rename="camel"):
	action: str
	type: str
	value: WatchStatusMessage
