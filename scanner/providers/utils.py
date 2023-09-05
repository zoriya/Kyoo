import os
from datetime import date
from itertools import chain

from typing import Literal

from providers.types.movie import Movie
from providers.types.show import Show


def format_date(date: date | int | None) -> str | None:
	if date is None:
		return None
	if isinstance(date, int):
		return f"{date}-01-01"
	return date.isoformat()


def select_image(
	self: Movie | Show,
	type: Literal["posters"] | Literal["thumbnails"] | Literal["logos"],
) -> str | None:
	# For now, the API of kyoo only support one language so we remove the others.
	default_language = os.environ["LIBRARY_LANGUAGES"].split(",")[0]
	return next(
		chain(
			(
				getattr(self.translations[self.original_language], type)
				if self.original_language
				else []
			),
			getattr(self.translations[default_language], type),
			*(getattr(x, type) for x in self.translations.values()),
		),
		None,
	)


class ProviderError(RuntimeError):
	def __init__(self, *args: object) -> None:
		super().__init__(*args)
