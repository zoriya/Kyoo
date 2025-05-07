import os
import re
from logging import getLogger
from mimetypes import guess_file_type
from os.path import dirname, exists, isdir, join
from typing import Optional

from watchfiles import Change, awatch

from .client import KyooClient
from .identify import identify
from .models.metadataid import EpisodeId, MetadataId
from .models.videos import For, Video, VideoInfo
from .queue import Request, enqueue

logger = getLogger(__name__)


class Scanner:
	def __init__(self, client: KyooClient):
		self._client = client
		self._info: VideoInfo = None  # type: ignore
		try:
			pattern = os.environ.get("LIBRARY_IGNORE_PATTERN")
			self._ignore_pattern = re.compile(pattern) if pattern else None
		except re.error as e:
			logger.error(f"Invalid ignore pattern. Ignoring. Error: {e}")

	async def scan(self, path: Optional[str], remove_deleted=False):
		if path is None:
			logger.info("Starting scan at %s. This may take some time...", path)
			if self._ignore_pattern:
				logger.info(f"Applying ignore pattern: {self._ignore_pattern}")
		path = path or os.environ.get("SCANNER_LIBRARY_ROOT", "/video")
		videos = self.walk_fs(path)

		self._info = await self._client.get_videos_info()

		# TODO: handle unmatched
		to_register = videos - self._info.paths
		to_delete = self._info.paths - videos if remove_deleted else set()

		if (
			not any(to_register)
			and any(to_delete)
			and len(to_delete) == len(self._info.paths)
		):
			logger.warning("All video files are unavailable. Check your disks.")
			return

		# delete stale files before creating new ones to prevent potential conflicts
		if to_delete:
			logger.info("Removing %d stale files.", len(to_delete))
			await self._client.delete_videos(to_delete)

		if to_register:
			logger.info("Found %d new files to register.", len(to_register))
			await self._register(to_register)

		logger.info("Scan finished for %s.", path)

	async def monitor(self, path: str, client: KyooClient):
		async for changes in awatch(path, ignore_permission_denied=True):
			for event, file in changes:
				if not isdir(file) and not is_video(file):
					continue
				if (
					self._ignore_pattern and self._ignore_pattern.match(file)
				) or is_ignored_path(file):
					logger.info("Ignoring event %s for file %s", event, file)
					continue

				match event:
					case Change.added if isdir(file):
						logger.info("New dir found: %s", file)
						await self.scan(file)
					case Change.added:
						logger.info("New video found: %s", file)
						await self._register([file])
					case Change.deleted:
						logger.info("Delete video at: %s", file)
						await client.delete_videos([file])
					case Change.modified:
						pass

	async def _register(self, videos: list[str] | set[str]):
		# TODO: we should probably chunk those
		vids: list[Video] = []
		for path in videos:
			try:
				vid = await identify(path)
				vid = self._match(vid)
				vids.append(vid)
			except Exception as e:
				logger.error("Couldn't identify %s.", path, exc_info=e)
		created = await self._client.create_videos(vids)

		await enqueue(
			[
				Request(
					kind=x.guess.kind,
					title=x.guess.title,
					year=next(iter(x.guess.years), None),
					videos=[Request.Video(id=x.id, episodes=x.guess.episodes)],
				)
				for x in created
				if not any(x.entries) and x.guess.kind != "extra"
			]
		)

	def _match(self, video: Video) -> Video:
		video.for_ = []

		year_info = (
			self._info.guesses[video.guess.title]
			if video.guess.title in self._info.guesses
			else {}
		)
		slugs = set(
			x
			for x in (
				[
					year_info[str(y)].slug if str(y) in year_info else None
					for y in video.guess.years
				]
				+ ([year_info["unknown"].slug] if "unknown" in year_info else [])
			)
			if x is not None
		)

		if video.guess.kind == "movie":
			for slug in slugs:
				video.for_.append(For.Movie(movie=slug))

			for k, v in video.guess.external_id.items():
				video.for_.append(
					For.ExternalId(external_id={k: MetadataId(data_id=v)})
				)
		else:
			for ep in video.guess.episodes:
				if ep.season is not None:
					for slug in slugs:
						video.for_.append(
							For.Episode(
								serie=slug, season=ep.season, episode=ep.episode
							)
						)

				for k, v in video.guess.external_id.items():
					video.for_.append(
						For.ExternalId(
							external_id={
								k: EpisodeId(
									serie_id=v, season=ep.season, episode=ep.episode
								)
							}
						)
					)

		# TODO: handle specials & movie as episodes (needs animelist or thexem)
		return video

	def walk_fs(self, root_path: str) -> set[str]:
		videos: set[str] = set()
		for dirpath, dirnames, files in os.walk(root_path):
			# Skip directories with a `.ignore` file
			if ".ignore" in files:
				# Prevents os.walk from descending into this directory
				dirnames.clear()
				continue

			for file in files:
				file_path = os.path.join(dirpath, file)
				# Apply ignore pattern, if any
				if self._ignore_pattern and self._ignore_pattern.match(file_path):
					continue
				if is_video(file_path):
					videos.add(file_path)
		return videos


def is_ignored_path(path: str) -> bool:
	current_path = path
	# Traverse up to the root directory
	while current_path != "/":
		if exists(join(current_path, ".ignore")):
			return True
		current_path = dirname(current_path)
	return False


def is_video(path: str) -> bool:
	(mime, _) = guess_file_type(path, strict=False)
	return mime is not None and mime.startswith("video/")
