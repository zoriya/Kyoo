from typing import Annotated

from fastapi import Header, Request
from langcodes import Language

from ..client import KyooClient
from ..providers.composite import CompositeProvider
from ..requests import RequestCreator


def get_provider(request: Request) -> CompositeProvider:
	return request.app.state.provider


def get_client(_request: Request) -> KyooClient:
	return KyooClient()


def get_request_creator(request: Request) -> RequestCreator:
	return RequestCreator(request.app.state.pool)


def get_preferred_languages(
	accept_language: Annotated[str | None, Header()] = None,
) -> list[Language]:
	if not accept_language:
		return []

	ret: list[tuple[float, int, Language]] = []
	for index, item in enumerate(accept_language.split(",")):
		part = item.strip()
		if not part:
			continue

		tag, *params = [x.strip() for x in part.split(";")]
		if tag == "*":
			continue

		try:
			q = next((float(x[2:]) for x in params if x.startswith("q=")), 1)
			if q <= 0:
				continue

			language = Language.get(tag)
			ret.append((q, index, language))
		except Exception:
			continue

	ret.sort(key=lambda x: (-x[0], x[1]))
	return [x for _q, _i, x in ret] + [Language.get("en")]
