from .scanner import scan

def main():
	import os
	import logging
	import sys

	path = os.environ.get("LIBRARY_ROOT")
	if not path:
		print("Missing environment variable 'LIBRARY_ROOT'.")
		exit(2)
	if len(sys.argv) > 1 and sys.argv[1] == "-v":
		logging.basicConfig(level=logging.INFO)
	return scan(path)
