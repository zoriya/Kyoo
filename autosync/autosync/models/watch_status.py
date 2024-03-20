from datetime import date
from dataclasses import dataclass
from typing import Optional
from enum import Enum


class Status(str, Enum):
	COMPLETED = "completed"
	WATCHING = "watching"
	DROPED = "droped"
	PLANNED = "planned"
	DELETED = "deleted"


@dataclass
class WatchStatus:
	added_date: date
	played_date: date
	status: Status
	watched_time: Optional[int]
	watched_percent: Optional[int]
