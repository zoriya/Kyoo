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
from ..models.metadataid import EpisodeId
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
		tmdbtv: str | None = attr(default=None)
		tmdbid: str | None = attr(default=None)
		imdbid: str | None = attr(default=None)
		name: str | None = element(default=None)
		mapping_list: MappingList = element(default=[])

		@field_validator("tvdbid", "tmdbtv", "tmdbid", "imdbid", "defaulttvdbseason")
		@classmethod
		def _empty_to_none(cls, v: str | None) -> str | None:
			# pornographic titles have this id.
			if v == "hentai":
				return None
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


def anidb_to_tvdb(
	anime: AnimeListDb.AnimeEntry,
	anidb_ep: int,
) -> tuple[int | None, list[int]]:
	for map in anime.mapping_list.mappings:
		if map.anidbseason != 1 or map.tvdbseason is None:
			continue

		# Handle mapping overrides (;anidb-tvdb; format)
		if anidb_ep in map.tvdb_mappings:
			tvdb_eps = map.tvdb_mappings[anidb_ep]
			# Mapped to 0 means no TVDB equivalent
			if tvdb_eps[0] == 0:
				return (None, [])
			return (map.tvdbseason, tvdb_eps)

		# Check start/end range with offset
		if (
			map.start is not None
			and map.end is not None
			and map.start <= anidb_ep <= map.end
		):
			return (map.tvdbseason, [anidb_ep + map.offset])

	if anime.defaulttvdbseason == "a":
		return (None, [anidb_ep])
	return (anime.defaulttvdbseason, [anidb_ep + anime.episodeoffset])


def tvdb_to_anidb(
	anime: AnimeListDb.AnimeEntry,
	tvdb_season: int | None,
	tvdb_ep: int,
) -> list[int]:
	for map in anime.mapping_list.mappings:
		if map.anidbseason != 1 or map.tvdbseason != tvdb_season:
			continue

		# Handle mapping overrides (;anidb-tvdb; format)
		overrides = [
			anidb_num
			for anidb_num, tvdb_nums in map.tvdb_mappings.items()
			if tvdb_ep in tvdb_nums
		]
		if len(overrides):
			return overrides

		# Reverse the start/end range offset
		if map.start is not None and map.end is not None:
			candidate = tvdb_ep - map.offset
			if map.start <= candidate <= map.end:
				return [candidate]

	return [tvdb_ep - anime.episodeoffset]


async def anilist(_path: str, guess: Guess) -> Guess:
	data = await get_data()

	aid = data.titles.get(guess.title)
	if aid is None:
		return guess
	anime = data.animes.get(aid)
	if anime is None:
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
	# tmdbtv is for TV series, tmdbid is for standalone movies
	if anime.tmdbtv:
		new_external_id[ProviderName.TMDB] = anime.tmdbtv
	elif anime.tmdbid:
		new_external_id[ProviderName.TMDB] = anime.tmdbid
	if anime.imdbid:
		new_external_id[ProviderName.IMDB] = anime.imdbid

	new_episodes: list[Guess.Episode] = []
	for ep in guess.episodes:
		if anime.defaulttvdbseason is None or anime.tvdbid is None:
			new_episodes.append(
				Guess.Episode(
					season=ep.season,
					episode=ep.episode,
					external_id={
						ProviderName.ANIDB: EpisodeId(
							serie_id=aid,
							season=None,
							episode=ep.episode,
						),
					},
				)
			)
			continue

		# guess numbers are anidb-relative if defaulttvdbseason != 1 because
		# the title already contains season information.
		tvdb_season, tvdb_eps = (
			(ep.season if ep.season is not None else 1, [ep.episode])
			if anime.defaulttvdbseason == 1
			else anidb_to_tvdb(anime, ep.episode)
		)
		anidb_eps = (
			tvdb_to_anidb(anime, tvdb_season, ep.episode)
			if anime.defaulttvdbseason == 1
			else [ep.episode]
		)

		new_episodes += [
			Guess.Episode(
				season=tvdb_season,
				episode=tvdb_ep,
				external_id={
					ProviderName.TVDB: EpisodeId(
						serie_id=anime.tvdbid,
						season=tvdb_season,
						episode=tvdb_ep,
					),
					ProviderName.ANIDB: EpisodeId(
						serie_id=aid,
						season=None,
						episode=anidb_ep,
					),
				},
			)
			for tvdb_ep, anidb_ep in zip(tvdb_eps, anidb_eps)
		]

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
