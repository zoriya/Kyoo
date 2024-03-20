from datetime import datetime, time
from dataclasses import dataclass
from typing import Optional


@dataclass
class JwtToken:
	token_type: str
	access_token: str
	refresh_token: str
	expire_in: time
	expire_at: datetime


@dataclass
class ExternalToken:
	id: str
	username: str
	profileUrl: Optional[str]
	token: JwtToken


@dataclass
class User:
	id: str
	username: str
	email: str
	permissions: list[str]
	settings: dict[str, str]
	external_id: dict[str, ExternalToken]
