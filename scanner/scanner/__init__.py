from providers.utils import ProviderError
from .scanner import Scanner
from .monitor import monitor


async def main():
	import os
	import logging
	import sys
	import jsons
	from datetime import date
	from typing import Optional
	from aiohttp import ClientSession
	from providers.utils import format_date

	path = os.environ.get("SCANNER_LIBRARY_ROOT", "/video")
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
		try:
			scanner = Scanner(client, languages=languages.split(","), api_key=api_key)
			await scanner.scan(path)
			logging.info("Scan finished. Starting to monitor...")
			await monitor(path, scanner)
		except ProviderError as e:
			logging.error(e)
