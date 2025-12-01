from typing import Literal

from asyncpg import Connection
from pydantic import TypeAdapter

from scanner.database import get_db

from .models.request import RequestRet


class StatusService:
	def __init__(self, database: Connection):
		self._database = database

	@classmethod
	async def create(cls):
		async with get_db() as db:
			yield StatusService(db)

	async def list_requests(
		self, *, status: Literal["pending", "running", "failed"] | None = None
	) -> list[RequestRet]:
		ret = await self._database.fetch(
			f"""
			select
				pk::text as id,
				kind,
				title,
				year,
				status,
				started_at
			from
				scanner.requests
			order by
				started_at,
				pk
			{"where status = $1" if status is not None else ""}
			""",
			*([status] if status is not None else []),
		)
		return TypeAdapter(list[RequestRet]).validate_python(ret)
