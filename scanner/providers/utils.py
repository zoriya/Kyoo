from datetime import date


def format_date(date: date | int | None) -> str | None:
	if date is None:
		return None
	if isinstance(date, int):
		return f"{date}-01-01"
	return date.isoformat()


class ProviderError(RuntimeError):
	def __init__(self, *args: object) -> None:
		super().__init__(*args)
