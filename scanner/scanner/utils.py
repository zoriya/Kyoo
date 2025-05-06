from datetime import date

from langcodes import Language
from pydantic import AliasGenerator, BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


def format_date(date: date | int | None) -> str | None:
	if date is None:
		return None
	if isinstance(date, int):
		return f"{date}-01-01"
	return date.isoformat()


def normalize_lang(lang: str) -> str:
	return str(Language.get(lang))


class ProviderError(RuntimeError):
	def __init__(self, *args: object) -> None:
		super().__init__(*args)


class Model(BaseModel):
	model_config = ConfigDict(
		use_enum_values=True,
		alias_generator=AliasGenerator(
			serialization_alias=lambda x: to_camel(x[:-1] if x[-1] == "_" else x),
		),
	)
