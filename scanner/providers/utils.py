from __future__ import annotations

import os
from datetime import date

from typing import Literal, Any

from providers.types.movie import Movie
from providers.types.show import Show
from providers.types.season import Season
from providers.types.episode import Episode
from providers.types.collection import Collection

type Resource = Movie | Show | Season | Episode | Collection


def format_date(date: date | int | None) -> str | None:
	if date is None:
		return None
	if isinstance(date, int):
		return f"{date}-01-01"
	return date.isoformat()


# For now, the API of kyoo only support one language so we remove the others.
default_languages = os.environ["LIBRARY_LANGUAGES"].split(",")


def select_translation(value: Resource, *, prefer_orginal=False) -> Any:
	if (
		prefer_orginal
		and (isinstance(value, Movie) or isinstance(value, Show))
		and value.original_language
		and value.original_language in value.translations
	):
		return value.translations[value.original_language]
	for lang in default_languages:
		if lang in value.translations:
			return value.translations[lang]
	return None


def select_image(
	value: Resource,
	kind: Literal["posters"] | Literal["thumbnails"] | Literal["logos"],
) -> str | None:
	trans = select_translation(value, prefer_orginal=True) or next(
		iter(value.translations.values()), None
	)
	if trans is None:
		return None
	return getattr(trans, kind)


class ProviderError(RuntimeError):
	def __init__(self, *args: object) -> None:
		super().__init__(*args)
