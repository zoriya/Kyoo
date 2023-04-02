import asyncio
from functools import wraps
from watchdog.observers import Observer
from watchdog.events import (
	FileSystemEventHandler,
	DirCreatedEvent,
	FileCreatedEvent,
	DirMovedEvent,
	FileMovedEvent,
	DirDeletedEvent,
	FileDeletedEvent,
)

from scanner.utils import log_errors

from .scanner import Scanner

task_list = []
event = asyncio.Event()


async def monitor(path: str, scanner: Scanner):
	global task_list

	observer = Observer()
	handler = EventHandler(scanner)
	observer.schedule(handler, path, recursive=True)
	observer.start()

	while True:
		if any(task_list):
			tl = task_list
			task_list = []
			await asyncio.gather(*tl)
		await event.wait()
		event.clear()
	# Should call .join() if the while stops one day.
	# observer.join()


def async_event(f):
	# Log errors of f and catch them to prevent the gather to throw.
	f = log_errors(f)

	@wraps(f)
	def internal(*args, **kwargs):
		task_list.append(f(*args, **kwargs))
		event.set()

	return internal


class EventHandler(FileSystemEventHandler):
	def __init__(self, scanner: Scanner):
		self._scanner = scanner

	@async_event
	async def on_created(self, event: DirCreatedEvent | FileCreatedEvent):
		if event.is_directory:
			return
		await self._scanner.identify(event.src_path)

	# TODO: Implement the following two methods
	def on_moved(self, event: DirMovedEvent | FileMovedEvent):
		if event.is_directory:
			# TODO: Check if this event is also called for files in the directory or not.
			return
		print(event.src_path, event.dest_path)

	def on_deleted(self, event: DirDeletedEvent | FileDeletedEvent):
		if event.is_directory:
			# TODO: Check if this event is also called for files in the directory or not.
			return
		print(event.src_path)
