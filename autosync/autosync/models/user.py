from msgspec import Struct
from datetime import datetime
from typing import Optional


class JwtToken(Struct):
	token_type: str
	access_token: str
	refresh_token: Optional[str]
	expire_at: datetime


class ExternalToken(Struct, rename="camel"):
	id: str
	username: str
	profile_url: Optional[str]
	token: JwtToken


class User(Struct, rename="camel", tag_field="kind", tag="user"):
	id: str
	username: str
	email: str
	permissions: list[str]
	settings: dict[str, str]
	external_id: dict[str, ExternalToken]
