from datetime import date
from dataclasses import dataclass
from dataclasses_json import dataclass_json, LetterCase
from typing import Optional
from enum import Enum


class Status(str, Enum):
	COMPLETED = "Completed"
	WATCHING = "Watching"
	DROPED = "Droped"
	PLANNED = "Planned"
	DELETED = "Deleted"


@dataclass_json(letter_case=LetterCase.CAMEL)
@dataclass
class WatchStatus:
	added_date: date
	played_date: Optional[date]
	status: Status
	watched_time: Optional[int]
	watched_percent: Optional[int]
