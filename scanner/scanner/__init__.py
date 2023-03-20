from .scanner import Scanner


async def main():
	import os
	import logging
	import sys
	from aiohttp import ClientSession

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

	async with ClientSession() as client:
		await Scanner(client, languages=languages.split(","), api_key=api_key).scan(
			path
		)
