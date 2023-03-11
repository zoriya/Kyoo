from pathlib import Path

def scan(path: str):
	for item in Path(path).rglob("*"):
		if not item.is_file():
			continue
		print(item)
