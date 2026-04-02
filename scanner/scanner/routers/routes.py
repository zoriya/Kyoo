from typing import Annotated, Literal

from fastapi import (
	APIRouter,
	BackgroundTasks,
	Depends,
	Security,
)
from fastapi import (
	Request as HttpRequest,
)

from ..client import KyooClient
from ..fsscan import create_scanner
from ..identifiers.identify import identify
from ..jwt import validate_bearer
from ..models.metadataid import MetadataId
from ..models.movie import SearchMovie
from ..models.page import Page
from ..models.request import CreateRequest, Request, RequestRet
from ..models.serie import SearchSerie
from ..models.videos import Guess, Video
from ..providers.composite import CompositeProvider
from ..requests import RequestCreator
from ..status import StatusService
from ..utils import Language
from .dependencies import (
	get_client,
	get_preferred_languages,
	get_provider,
	get_request_creator,
)

router = APIRouter()


@router.get("/scan")
async def get_scan_status(
	svc: Annotated[StatusService, Depends(StatusService.create)],
	request: HttpRequest,
	_: Annotated[None, Security(validate_bearer, scopes=["scanner.trigger"])],
	status: Literal["pending", "running", "failed"] | None = None,
) -> Page[RequestRet]:
	"""
	Get scan status, know what tasks are running, pending or failed.
	"""

	items = await svc.list_requests(status=status)
	return Page(items=items, this_=str(request.url), next=None)


@router.put(
	"/scan",
	status_code=204,
	response_description="Scan started.",
)
async def trigger_scan(
	tasks: BackgroundTasks,
	_: Annotated[None, Security(validate_bearer, scopes=["scanner.trigger"])],
):
	"""
	Trigger a full scan of the filesystem, trying to find new videos & deleting old ones.
	"""

	async def run():
		async with create_scanner() as scanner:
			await scanner.scan()

	tasks.add_task(run)


@router.get(
	"/guess",
	status_code=200,
	response_description="Identify a path",
)
async def get_guess(
	path: str,
	_: Annotated[None, Security(validate_bearer, scopes=["scanner.guess"])],
) -> Video:
	"""
	Identify a video path and return a serie/movie guess.
	"""

	return await identify(path)


@router.get(
	"/movies",
	status_code=200,
	response_description="Found movies",
)
async def get_movies(
	provider: Annotated[CompositeProvider, Depends(get_provider)],
	language: Annotated[list[Language], Depends(get_preferred_languages)],
	request: HttpRequest,
	_: Annotated[None, Security(validate_bearer, scopes=["scanner.search"])],
	query: str,
	year: int | None = None,
) -> Page[SearchMovie]:
	"""
	Search for a movie
	"""

	items = await provider.search_movies(query, year=year, language=language)
	return Page(items=items, this_=str(request.url), next=None)


@router.get(
	"/series",
	status_code=200,
	response_description="Found series",
)
async def get_series(
	provider: Annotated[CompositeProvider, Depends(get_provider)],
	language: Annotated[list[Language], Depends(get_preferred_languages)],
	request: HttpRequest,
	_: Annotated[None, Security(validate_bearer, scopes=["scanner.search"])],
	query: str,
	year: int | None = None,
) -> Page[SearchSerie]:
	"""
	Search for a serie
	"""

	items = await provider.search_series(query, year=year, language=language)
	return Page(items=items, this_=str(request.url), next=None)


@router.post(
	"/movies",
	status_code=201,
	response_description="Movie metadata request created.",
)
async def create_movie(
	body: CreateRequest,
	requests: Annotated[RequestCreator, Depends(get_request_creator)],
	_: Annotated[None, Security(validate_bearer, scopes=["scanner.add"])],
) -> RequestRet:
	"""
	Create a movie metadata request.
	"""

	[ret] = await requests.enqueue(
		[
			Request(
				kind="movie",
				title=body.title,
				year=body.year,
				external_id=body.external_id,
				videos=body.videos,
			)
		]
	)
	return ret


@router.post(
	"/series",
	status_code=201,
	response_description="Series metadata request created.",
)
async def create_serie(
	body: CreateRequest,
	requests: Annotated[RequestCreator, Depends(get_request_creator)],
	_: Annotated[None, Security(validate_bearer, scopes=["scanner.add"])],
) -> RequestRet:
	"""
	Create a series metadata request.
	"""

	[ret] = await requests.enqueue(
		[
			Request(
				kind="episode",
				title=body.title,
				year=body.year,
				external_id=body.external_id,
				videos=body.videos,
			)
		]
	)
	return ret


@router.post(
	"/movies/{slug}/refresh",
	status_code=201,
	response_description="Movie refresh request created.",
)
async def refresh_movie_by_slug(
	slug: str,
	client: Annotated[KyooClient, Depends(get_client)],
	requests: Annotated[RequestCreator, Depends(get_request_creator)],
	_: Annotated[None, Security(validate_bearer, scopes=["scanner.add"])],
) -> RequestRet:
	"""
	Refresh an existing movie
	"""

	show = await client.get_movie(slug)
	[ret] = await requests.enqueue(
		[
			Request(
				kind="movie",
				title=show.name,
				year=show.air_date.year if show.air_date is not None else None,
				external_id=MetadataId.map_dict(show.external_id),
				videos=[],
			)
		]
	)
	return ret


@router.post(
	"/series/{slug}/refresh",
	status_code=201,
	response_description="Series refresh request created.",
)
async def refresh_serie_by_slug(
	slug: str,
	client: Annotated[KyooClient, Depends(get_client)],
	requests: Annotated[RequestCreator, Depends(get_request_creator)],
	_: Annotated[None, Security(validate_bearer, scopes=["scanner.add"])],
) -> RequestRet:
	"""
	Refresh an existing serie
	"""

	show = await client.get_serie(slug)
	[ret] = await requests.enqueue(
		[
			Request(
				kind="episode",
				title=show.name,
				year=show.start_air.year if show.start_air is not None else None,
				external_id=MetadataId.map_dict(show.external_id),
				videos=[],
			)
		]
	)
	return ret


@router.post(
	"/{kind}/{slug}/remap",
	status_code=201,
	response_description="Show remap request created.",
)
async def remap_show_by_slug(
	kind: Literal["series", "movies"],
	slug: str,
	body: CreateRequest,
	client: Annotated[KyooClient, Depends(get_client)],
	requests: Annotated[RequestCreator, Depends(get_request_creator)],
	_: Annotated[None, Security(validate_bearer, scopes=["scanner.add"])],
) -> RequestRet:
	"""
	Delete an existing show and recreate a request with remapped metadata and all videos.
	"""

	videos = (
		await client.get_movie_videos(slug)
		if kind == "movies"
		else await client.get_serie_videos(slug)
	)

	if kind == "movies":
		await client.delete_movie(slug)
	else:
		await client.delete_serie(slug)

	merged_videos: dict[str, set[tuple[int | None, int]]] = {}
	for video in body.videos + videos:
		if video.id not in merged_videos:
			merged_videos[video.id] = set()
		merged_videos[video.id].update((ep.season, ep.episode) for ep in video.episodes)

	[ret] = await requests.enqueue(
		[
			Request(
				kind="movie" if kind == "movies" else "episode",
				title=body.title,
				year=body.year,
				external_id=body.external_id,
				videos=[
					Request.Video(
						id=video_id,
						episodes=[
							Guess.Episode(season=s, episode=e) for s, e in episodes
						],
					)
					for video_id, episodes in merged_videos.items()
				],
			)
		]
	)
	return ret
