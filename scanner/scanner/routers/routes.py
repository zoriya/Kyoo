from typing import Annotated

from asyncpg import Connection
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Security

from scanner.database import get_db_fapi

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


@router.get("/health")
def get_health():
	return {"status": "healthy"}


@router.get("/ready")
async def get_ready(db: Annotated[Connection, Depends(get_db_fapi)]):
	try:
		_ = await db.execute("select 1")
		return {"status": "healthy", "database": "healthy"}
	except Exception as e:
		raise HTTPException(
			status_code=500, detail={"status": "unhealthy", "database": str(e)}
		)
