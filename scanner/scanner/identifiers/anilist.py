from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass
from datetime import datetime, timedelta
from functools import cached_property
from logging import getLogger
from typing import Literal

from aiohttp import ClientSession
from pydantic import field_validator
from pydantic_xml import BaseXmlModel, attr, element

from ..cache import cache
from ..models.metadataid import EpisodeId, MetadataId
from ..models.videos import Guess
from ..providers.names import ProviderName

logger = getLogger(__name__)


class AnimeTitlesDb(BaseXmlModel, tag="animetitles"):
	animes: list[AnimeTitlesEntry] = element(default=[])

	@classmethod
	def get_url(cls):
		return "https://raw.githubusercontent.com/Anime-Lists/anime-lists/master/animetitles.xml"

	class AnimeTitlesEntry(BaseXmlModel, tag="anime"):
		aid: str = attr()
		titles: list[AnimeTitle] = element(default=[])

		class AnimeTitle(
			BaseXmlModel,
			tag="title",
			nsmap={"xml": "http://www.w3.org/XML/1998/namespace"},
		):
			type: str = attr()
			lang: str = attr(ns="xml")
			text: str


class AnimeListDb(BaseXmlModel, tag="anime-list"):
	animes: list[AnimeEntry] = element(default=[])

	@classmethod
	def get_url(cls):
		return "https://raw.githubusercontent.com/Anime-Lists/anime-lists/refs/heads/master/anime-list.xml"

	class AnimeEntry(BaseXmlModel, tag="anime"):
		anidbid: str = attr()
		tvdbid: str | None = attr(default=None)
		defaulttvdbseason: int | Literal["a"] | None = attr(default=None)
		episodeoffset: int = attr(default=0)
		tmdbid: str | None = attr(default=None)
		imdbid: str | None = attr(default=None)
		name: str | None = element(default=None)
		mapping_list: MappingList | None = element(default=[])

		@field_validator("tmdbid", "imdbid")
		@classmethod
		def _empty_to_none(cls, v: str | None) -> str | None:
			return v or None

		class MappingList(BaseXmlModel, tag="mapping-list"):
			mappings: list[EpisodeMapping] = element(default=[])

			class EpisodeMapping(BaseXmlModel):
				anidbseason: int = attr()
				tvdbseason: int | None = attr(default=None)
				start: int | None = attr(default=None)
				end: int | None = attr(default=None)
				offset: int = attr(default=0)
				text: str | None = None

				@cached_property
				def tvdb_mappings(self) -> dict[int, list[int]]:
					if self.tvdbseason is None or not self.text:
						return {}
					ret = {}
					for map in self.text.split(";"):
						map = map.strip()
						if not map or "-" not in map:
							continue
						[aid, tvdbids] = map.split("-", 1)
						try:
							ret[int(aid.strip())] = [
								int(x.strip()) for x in tvdbids.split("+")
							]
						except ValueError:
							continue
					return ret


@dataclass
class AnimeListData:
	fetched_at: datetime
	# normalized title -> anidbid
	titles: dict[str, str] = {}
	# anidbid -> AnimeEntry
	animes: dict[str, AnimeListDb.AnimeEntry] = {}


@cache(ttl=timedelta(days=30))
async def get_data() -> AnimeListData:
	logger.info("Fetching anime-lists XML databases...")
	ret = AnimeListData(fetched_at=datetime.now())
	async with ClientSession() as session:
		async with session.get(AnimeTitlesDb.get_url()) as resp:
			resp.raise_for_status()
			titles = AnimeTitlesDb.from_xml(await resp.read())
			ret.titles = {
				normalize_title(title.text): x.aid
				for x in titles.animes
				for title in x.titles
			}
		async with session.get(AnimeListDb.get_url()) as resp:
			resp.raise_for_status()
			db = AnimeListDb.from_xml(await resp.read())
			ret.animes = {entry.anidbid: entry for entry in db.animes}

	logger.info(
		"Loaded %d anime titles from animelist-xml.",
		len(ret.titles),
	)
	return ret


def normalize_title(title: str) -> str:
	title = unicodedata.normalize("NFD", title)
	title = "".join(c for c in title if unicodedata.category(c) != "Mn")
	title = title.lower()
	title = re.sub(r"[^\w\s]", "", title)
	title = re.sub(r"\s+", " ", title).strip()
	return title


async def anilist(_path: str, guess: Guess) -> Guess:
	data = await get_data()

	aid = data.titles.get(guess.title)
	if aid is None:
		return guess
	anime = data.animes.get(aid)
	if anime is None:
		logger.warning("AniDB id %s found in titles but not in anime-list.xml", aid)
		return guess

	logger.info(
		"Matched '%s' to AniDB id %s (tvdb=%s, tmdbid=%s)",
		guess.title,
		aid,
		anime.tvdbid,
		anime.tmdbid,
	)

	new_external_id = dict(guess.external_id)
	new_external_id[ProviderName.ANIDB] = aid
	if anime.tvdbid:
		new_external_id[ProviderName.TVDB] = anime.tvdbid
	if anime.tmdbid:
		new_external_id[ProviderName.TMDB] = anime.tmdbid
	if anime.imdbid:
		new_external_id[ProviderName.IMDB] = anime.imdbid

	new_episodes: list[Guess.Episode] = []
	for ep in guess.episodes:
		# TODO: implement this
		...

	return Guess(
		title=guess.title,
		kind=guess.kind,
		extra_kind=guess.extra_kind,
		years=guess.years,
		episodes=new_episodes,
		external_id=new_external_id,
		raw=guess.raw,
		from_="anilist",
		history=[*guess.history, guess],
	)
