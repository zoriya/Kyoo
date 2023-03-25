from .scanner import Scanner


async def main():
	import os
	import logging
	import sys
	import jsons
	from datetime import date
	from typing import Optional
	from aiohttp import ClientSession
	from providers.utils import format_date

	path = os.environ.get("LIBRARY_ROOT")
	if not path:
		print("Missing environment variable 'LIBRARY_ROOT'.")
		exit(2)
	languages = os.environ.get("LIBRARY_LANGUAGES")
	if not languages:
		print("Missing environment variable 'LIBRARY_LANGUAGES'.")
		exit(2)
	api_key = os.environ.get("KYOO_APIKEY")
	if not api_key:
		api_key = os.environ.get("KYOO_APIKEYS")
		if not api_key:
			print("Missing environment variable 'KYOO_APIKEY'.")
			exit(2)
		api_key = api_key.split(",")[0]

	if len(sys.argv) > 1 and sys.argv[1] == "-v":
		logging.basicConfig(level=logging.INFO)
	if len(sys.argv) > 1 and sys.argv[1] == "-vv":
		logging.basicConfig(level=logging.DEBUG)

	jsons.set_serializer(lambda x, **_: format_date(x), Optional[date | int])
	async with ClientSession(
		json_serialize=lambda *args, **kwargs: jsons.dumps(
			*args, key_transformer=jsons.KEY_TRANSFORMER_CAMELCASE, **kwargs
		),
	) as client:
		await Scanner(client, languages=languages.split(","), api_key=api_key).scan(
			path
		)
