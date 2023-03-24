from datetime import date

def format_date(date: date | int | None) -> str | None:
	if date is None:
		return None
	if isinstance(date, int):
		return f"{date}-01-01T00:00:00Z"
	return date.isoformat()
