from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Security

from ..fsscan import create_scanner
from ..jwt import validate_bearer

router = APIRouter()


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
