from typing import Annotated

from fastapi import BackgroundTasks, Depends, Security

from scanner import app
from scanner.fsscan import Scanner
from scanner.jwt import validate_bearer


@app.put(
	"/scan",
	status_code=204,
	response_description="Scan started.",
)
async def trigger_scan(
	tasks: BackgroundTasks,
	scanner: Annotated[Scanner, Depends],
	_: Annotated[None, Security(validate_bearer, scopes=["scanner.trigger"])],
):
	"""
	Trigger a full scan of the filesystem, trying to find new videos & deleting old ones.
	"""
	tasks.add_task(scanner.scan)
