from abc import ABCMeta
from typing import Annotated, Any, Callable, override

from langcodes import Language as BaseLanguage
from pydantic import AliasGenerator, BaseModel, ConfigDict, GetJsonSchemaHandler
from pydantic.alias_generators import to_camel
from pydantic.json_schema import JsonSchemaValue
from pydantic_core import core_schema


def to_slug(title: str) -> str:
	return title


def clean(val: str) -> str | None:
	return val or None


class Singleton(ABCMeta, type):
	_instances = {}

	@override
	def __call__(cls, *args, **kwargs):
		if cls not in cls._instances:
			cls._instances[cls] = super(Singleton, cls).__call__(*args, **kwargs)
		return cls._instances[cls]


class Model(BaseModel):
	model_config = ConfigDict(
		use_enum_values=True,
		alias_generator=AliasGenerator(
			serialization_alias=lambda x: to_camel(x[:-1] if x[-1] == "_" else x),
		),
	)


class _LanguagePydanticAnnotation:
	@classmethod
	def __get_pydantic_core_schema__(
		cls,
		_source_type: Any,
		_handler: Callable[[Any], core_schema.CoreSchema],
	) -> core_schema.CoreSchema:
		def validate_from_str(value: str) -> BaseLanguage:
			return BaseLanguage.get(value)

		from_str_schema = core_schema.chain_schema(
			[
				core_schema.str_schema(),
				core_schema.no_info_plain_validator_function(validate_from_str),
			]
		)

		return core_schema.json_or_python_schema(
			json_schema=from_str_schema,
			python_schema=core_schema.union_schema(
				[
					core_schema.is_instance_schema(BaseLanguage),
					from_str_schema,
				]
			),
			serialization=core_schema.to_string_ser_schema(),
		)

	@classmethod
	def __get_pydantic_json_schema__(
		cls, _core_schema: core_schema.CoreSchema, handler: GetJsonSchemaHandler
	) -> JsonSchemaValue:
		return handler(core_schema.str_schema())


Language = Annotated[BaseLanguage, _LanguagePydanticAnnotation]
