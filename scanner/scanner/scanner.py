from pathlib import Path
from guessit import guessit
import logging

def scan(path: str):
	for item in Path(path).rglob("*"):
		if not item.is_file():
			continue
		identify(item)

def identify(path: Path):
	raw = guessit(path)
	logging.info("Identied %s: %s", path, raw)
	# print(f'type: {raw["type"]}, title: {raw["title"]}')
