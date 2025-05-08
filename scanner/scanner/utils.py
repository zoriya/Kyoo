from langcodes import Language
from pydantic import AliasGenerator, BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


def normalize_lang(lang: str) -> str:
	return str(Language.get(lang))


def to_slug(title: str) -> str:
	return title

def clean(val: str) -> str | None:
	return val or None


class Model(BaseModel):
	model_config = ConfigDict(
		use_enum_values=True,
		alias_generator=AliasGenerator(
			serialization_alias=lambda x: to_camel(x[:-1] if x[-1] == "_" else x),
		),
	)
