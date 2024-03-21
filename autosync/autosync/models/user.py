from datetime import datetime, time
from dataclasses import dataclass
from dataclasses_json import dataclass_json, LetterCase
from typing import Optional


@dataclass_json(letter_case=LetterCase.CAMEL)
@dataclass
class JwtToken:
	token_type: str
	access_token: str
	refresh_token: Optional[str]
	expire_in: time
	expire_at: datetime


@dataclass_json(letter_case=LetterCase.CAMEL)
@dataclass
class ExternalToken:
	id: str
	username: str
	profileUrl: Optional[str]
	token: JwtToken


@dataclass_json(letter_case=LetterCase.CAMEL)
@dataclass
class User:
	id: str
	username: str
	email: str
	permissions: list[str]
	settings: dict[str, str]
	external_id: dict[str, ExternalToken]
