from .scanner import scan

def main():
	import os
	path = os.environ.get("LIBRARY_PATH")
	if not path:
		print("Missing environment variable 'LIBRARY_PATH'.")
		exit(2)
	return scan(path)
