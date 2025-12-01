from typing import Annotated, Literal

from fastapi import APIRouter, BackgroundTasks, Depends, Security

from scanner.models.request import RequestRet
from scanner.status import StatusService

from ..fsscan import create_scanner
from ..jwt import validate_bearer

router = APIRouter()


@router.get("/scan")
async def get_scan_status(
	svc: Annotated[StatusService, Depends(StatusService.create)],
	_: Annotated[None, Security(validate_bearer, scopes=["scanner.trigger"])],
	status: Literal["pending", "running", "failed"] | None = None,
) -> list[RequestRet]:
	"""
	Get scan status, know what tasks are running, pending or failed.
	"""

	return await svc.list_requests(status=status)


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
