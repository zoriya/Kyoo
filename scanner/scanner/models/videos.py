from __future__ import annotations

from ..utils import Model
from typing import Optional


class Resource(Model):
	id: str
	slug: str


class VideoInfo(Model):
	paths: set[str]
	unmatched: set[str]
	guesses: dict[str, dict[str, Resource]]
