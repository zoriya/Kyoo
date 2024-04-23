from datetime import datetime
from typing import Optional
from enum import Enum

from msgspec import Struct


class Status(str, Enum):
	COMPLETED = "Completed"
	WATCHING = "Watching"
	DROPED = "Droped"
	PLANNED = "Planned"
	DELETED = "Deleted"


class WatchStatus(Struct, rename="camel"):
	added_date: datetime
	played_date: Optional[datetime]
	status: Status
	watched_time: Optional[int]
	watched_percent: Optional[int]
