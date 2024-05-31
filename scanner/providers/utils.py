from __future__ import annotations

import os
from datetime import date
from itertools import chain
from langcodes import Language
from typing import TYPE_CHECKING, Literal, Any, Optional

if TYPE_CHECKING:
	from providers.types.movie import Movie
	from providers.types.show import Show
	from providers.types.season import Season
	from providers.types.episode import Episode
	from providers.types.collection import Collection


def format_date(date: date | int | None) -> str | None:
	if date is None:
		return None
	if isinstance(date, int):
		return f"{date}-01-01"
	return date.isoformat()


def normalize_lang(lang: str) -> str:
	return str(Language.get(lang))


# For now, the API of kyoo only support one language so we remove the others.
default_languages = os.environ.get("LIBRARY_LANGUAGES", "").split(",")


def sort_translations(
	value: Movie | Show | Season | Episode | Collection,
	*,
	prefer_orginal=False,
):
	from providers.types.movie import Movie
	from providers.types.show import Show

	if (
		prefer_orginal
		and (isinstance(value, Movie) or isinstance(value, Show))
		and value.original_language
		and value.original_language in value.translations
	):
		yield value.translations[value.original_language]
	for lang in default_languages:
		if lang in value.translations:
			yield value.translations[lang]


def select_translation(
	value: Movie | Show | Season | Episode | Collection, *, prefer_orginal=False
) -> Optional[Any]:
	return next(sort_translations(value, prefer_orginal=prefer_orginal), None)


def select_image(
	value: Movie | Show | Season | Collection,
	kind: Literal["posters", "thumbnails", "logos", "trailers"],
) -> str | None:
	return next(
		chain(
			*(
				getattr(trans, kind)
				for trans in sort_translations(value, prefer_orginal=True)
			)
		),
		None,
	)


class ProviderError(RuntimeError):
	def __init__(self, *args: object) -> None:
		super().__init__(*args)
