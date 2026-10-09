from __future__ import annotations

import re
import unicodedata
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from functools import cached_property
from logging import getLogger
from typing import Literal

from aiohttp import ClientSession
from pydantic import field_validator
from pydantic_xml import BaseXmlModel, attr, element, wrapped

from ..cache import cache
from ..models.metadataid import EpisodeId, MetadataId, SeasonId
from ..models.serie import Serie
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
		mappings: list[EpisodeMapping] = wrapped(
			"mapping-list", element(default=[], tag="mapping")
		)

		@field_validator("tvdbid")
		@classmethod
		def _tvdb_validator(cls, v: str | None) -> str | None:
			# animes that don't match on tvdb can have a string explaining why it doesn't match
			# for example `movie`, `music video`, `OAV` or `hentai`
			return v if v and v.isdigit() else None

		@field_validator("tvdbid", "tmdbtv", "tmdbid", "imdbid", "defaulttvdbseason")
		@classmethod
		def _empty_to_none(cls, v: str | None) -> str | None:
			# `defaulttvdbseason="0"` (specials) should not be converted to None
			return v if v != "" else None

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
	titles: dict[str, str] = field(default_factory=dict)
	# normalized title without anidb's disambiguation year -> (year, anidbid)
	# (`Hunter x Hunter (1999)` is stored as `hunter x hunter` -> (1999, 132))
	yearless_titles: dict[str, list[tuple[int, str]]] = field(default_factory=dict)
	# anidbid -> AnimeEntry
	animes: dict[str, AnimeListDb.AnimeEntry] = field(default_factory=dict)
	# tvdbid -> anidbid
	tvdb_anidb: dict[str, list[str]] = field(default_factory=dict)


@cache(ttl=timedelta(days=30))
async def get_anilist_data() -> AnimeListData:
	logger.info("Fetching anime-lists XML databases...")
	ret = AnimeListData(fetched_at=datetime.now())
	async with ClientSession(
		headers={
			"User-Agent": "kyoo scanner v5",
		},
	) as session:
		async with session.get(AnimeTitlesDb.get_url()) as resp:
			resp.raise_for_status()
			titles = AnimeTitlesDb.from_xml(await resp.read())
			ret.titles = {
				normalize_title(title.text): x.aid
				for x in titles.animes
				for title in x.titles
			}
			ret.yearless_titles = defaultdict(list)
			for x in titles.animes:
				for title in x.titles:
					m = re.match(r"^(.*\S)\s*\((\d{4})\)$", title.text)
					if m:
						ret.yearless_titles[normalize_title(m.group(1))].append(
							(int(m.group(2)), x.aid)
						)
		async with session.get(AnimeListDb.get_url()) as resp:
			resp.raise_for_status()
			db = AnimeListDb.from_xml(await resp.read())
			ret.animes = {entry.anidbid: entry for entry in db.animes}
			ret.tvdb_anidb = defaultdict(list)
			for entry in db.animes:
				if not entry.tvdbid:
					continue
				ret.tvdb_anidb[entry.tvdbid].append(entry.anidbid)

	logger.info(
		"Loaded %d anime titles from animelist-xml.",
		len(ret.titles),
	)
	return ret


def normalize_title(title: str) -> str:
	title = unicodedata.normalize("NFD", title)
	title = "".join(c for c in title if unicodedata.category(c) != "Mn")
	title = title.lower()
	title = re.sub(r"[^\w\s]", " ", title)
	title = re.sub(r"\s+", " ", title).strip()
	return title


def anidb_to_tvdb(
	anime: AnimeListDb.AnimeEntry,
	anidb_ep: int,
) -> tuple[int | None, list[int]]:
	for map in anime.mappings:
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
	animes: list[AnimeListDb.AnimeEntry],
	tvdb_season: int,
	tvdb_ep: int,
) -> list[tuple[AnimeListDb.AnimeEntry, int, int]]:
	for anime in animes:
		for map in anime.mappings:
			if map.tvdbseason != tvdb_season:
				continue

			# Handle mapping overrides (;anidb-tvdb; format)
			overrides = [
				anidb_num
				for anidb_num, tvdb_nums in map.tvdb_mappings.items()
				if tvdb_ep in tvdb_nums
			]
			if len(overrides):
				return [(anime, map.anidbseason, ep) for ep in overrides]

			if map.start is not None and map.end is not None:
				candidate = tvdb_ep - map.offset
				if map.start <= candidate <= map.end:
					return [(anime, map.anidbseason, candidate)]

	seasons = sorted(
		(
			x
			for x in animes
			if x.defaulttvdbseason == tvdb_season and x.episodeoffset < tvdb_ep
		),
		key=lambda x: x.episodeoffset,
		reverse=True,
	)

	fallback = next(
		iter(seasons),
		next(
			(x for x in animes if x.defaulttvdbseason == "a"),
			animes[0],
		),
	)

	return [(fallback, 1, tvdb_ep - fallback.episodeoffset)]


async def identify_anilist(_path: str, guess: Guess) -> Guess:
	data = await get_anilist_data()

	title = normalize_title(guess.title)
	yearless = [
		(year, data.animes[x])
		for year, x in data.yearless_titles.get(title, [])
		if x in data.animes
	]
	anime = next((x for year, x in yearless if year in guess.years), None)
	if anime is None:
		aid = data.titles.get(title)
		anime = data.animes.get(aid) if aid else None
		if anime is None:
			return guess
		# a file named with the bare title of a special (pilot, ova) is way more likely to be
		# an episode of the serie with the same name & tvdb id.
		if anime.defaulttvdbseason == 0 and anime.tvdbid:
			anime = next(
				(
					x
					for _, x in yearless
					if x.tvdbid == anime.tvdbid
					and x.defaulttvdbseason == 1
					and x.episodeoffset == 0
				),
				anime,
			)
	aid = anime.anidbid

	new_external_id = dict(guess.external_id)
	new_external_id[ProviderName.ANIDB] = aid
	if anime.tvdbid:
		new_external_id[ProviderName.TVDB] = anime.tvdbid
	# tmdbtv is for TV series, tmdbid is for standalone movies
	if anime.tmdbtv:
		new_external_id[ProviderName.TMDB] = anime.tmdbtv
	elif anime.tmdbid and "," not in anime.tmdbid:
		new_external_id[ProviderName.TMDB] = anime.tmdbid
	if anime.imdbid and "," not in anime.imdbid:
		new_external_id[ProviderName.IMDB] = anime.imdbid

	# if we don't have a single external id, skip it and use the normal flow
	if len(new_external_id) == 1:
		return guess

	logger.info(
		"Matched '%s' to AniDB id %s (tvdb=%s, tmdbid=%s)",
		guess.title,
		aid,
		anime.tvdbid,
		anime.tmdbid,
	)

	animes = (
		[data.animes[id] for id in data.tvdb_anidb.get(anime.tvdbid, [])]
		if anime.tvdbid
		else []
	)
	new_title = next(
		(x.name for x in animes if x.defaulttvdbseason == 1),
		next(
			(x.name for x in animes if x.defaulttvdbseason == "a"),
			anime.name,
		),
	)

	new_episodes: list[Guess.Episode] = []
	for ep in guess.episodes:
		if (
			anime.tvdbid is None
			or anime.defaulttvdbseason is None
			or (anime.defaulttvdbseason == 1 and anime.episodeoffset == 0)
			# absolute numbered animes (`One Piece 155.mkv`) can also use tvdb numbers (`One Piece S21E33.mkv`)
			or (anime.defaulttvdbseason == "a" and "season" in guess.raw)
		):
			new_episodes.append(
				Guess.Episode(
					season=ep.season
					if ep.season is not None
					else (1 if anime.defaulttvdbseason else None),
					episode=ep.episode,
				)
			)
			continue

		# guess numbers are anidb-relative if the anime is not the first tvdb season
		# (or a later part of it) because the title already contains season information.
		tvdb_season, tvdb_eps = anidb_to_tvdb(anime, ep.episode)
		new_episodes += [
			Guess.Episode(
				season=tvdb_season,
				episode=tvdb_ep,
			)
			for tvdb_ep in tvdb_eps
		]

	kind = guess.kind
	if (
		guess.kind == "movie"
		and anime.tvdbid
		and isinstance(anime.defaulttvdbseason, int)
	):
		tvdb_season, tvdb_eps = anidb_to_tvdb(anime, 1)
		new_episodes += [
			Guess.Episode(season=tvdb_season, episode=tvdb_ep) for tvdb_ep in tvdb_eps
		]
	if anime.tvdbid and new_episodes:
		kind = "episode"
	elif anime.tmdbid:
		kind = "movie"

	return Guess(
		title=new_title or guess.title,
		kind=kind,
		extra_kind=guess.extra_kind,
		years=guess.years,
		episodes=new_episodes,
		external_id=new_external_id,
		raw=guess.raw,
		from_="anilist",
		history=[*guess.history, guess],
	)


async def anilist_enrich_ids(serie: Serie):
	data = await get_anilist_data()
	animes = [
		data.animes[aid]
		for tvdb_id in serie.external_id[ProviderName.TVDB]
		for aid in data.tvdb_anidb.get(tvdb_id.data_id, [])
	]
	if not animes:
		return serie

	serie.external_id[ProviderName.ANIDB] = [
		MetadataId(
			data_id=anime.anidbid,
			link=f"https://anidb.net/anime/{anime.anidbid}",
			label=anime.name,
		)
		for anime in animes
	]

	for season in serie.seasons:
		season.external_id[ProviderName.ANIDB] = [
			SeasonId(
				serie_id=anime.anidbid,
				season=1,
				link=f"https://anidb.net/anime/{anime.anidbid}",
				label=anime.name,
			)
			for anime in animes
			if anime.defaulttvdbseason == season.season_number
			or anime.defaulttvdbseason == "a"
		]

	for entry in serie.entries:
		season = entry.season_number or 0
		episode = entry.episode_number or entry.number
		if episode is None:
			continue
		entry.external_id[ProviderName.ANIDB] = [
			EpisodeId(serie_id=anime.anidbid, season=season, episode=ep)
			for anime, season, ep in tvdb_to_anidb(animes, season, episode)
		]

	return serie
