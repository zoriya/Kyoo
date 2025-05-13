from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, Security

from ..fsscan import FsScanner, create_scanner
from ..jwt import validate_bearer

router = APIRouter()


@router.put(
	"/scan",
	status_code=204,
	response_description="Scan started.",
)
async def trigger_scan(
	tasks: BackgroundTasks,
	scanner: Annotated[FsScanner, Depends(create_scanner)],
	_: Annotated[None, Security(validate_bearer, scopes=["scanner.trigger"])],
):
	"""
	Trigger a full scan of the filesystem, trying to find new videos & deleting old ones.
	"""
	tasks.add_task(scanner.scan)
