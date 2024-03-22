import os
import requests
import logging
from autosync.models.metadataid import MetadataID

from autosync.services.service import Service
from ..models.user import User
from ..models.show import Show
from ..models.movie import Movie
from ..models.episode import Episode
from ..models.watch_status import WatchStatus, Status


class Simkl(Service):
	def __init__(self) -> None:
		self._api_key = os.environ.get("OIDC_SIMKL_CLIENTID")

	@property
	def name(self) -> str:
		return "simkl"

	@property
	def enabled(self) -> bool:
		return self._api_key is not None

	def update(self, user: User, resource: Movie | Show | Episode, status: WatchStatus):
		if "simkl" not in user.external_id or self._api_key is None:
			return

		watch_date = status.played_date or status.added_date

		if resource.kind == "episode":
			if status.status != Status.COMPLETED:
				return

			resp = requests.post(
				"https://api.simkl.com/sync/history",
				json={
					"shows": [
						{
							"watched_at": watch_date.isoformat(),
							"title": resource.show.name,
							"year": resource.show.year,
							"ids": self._map_external_ids(resource.show.external_id),
							"seasons": [
								{
									"number": resource.season_number,
									"episodes": [{"number": resource.episode_number}],
								},
								{
									"number": 1,
									"episodes": [{"number": resource.absolute_number}],
								},
							],
						}
					]
				},
				headers={
					"Authorization": f"Bearer {user.external_id["simkl"].token.access_token}",
					"simkl-api-key": self._api_key,
				},
			)
			logging.info("Simkl response: %s %s", resp.status_code, resp.text)
			return

		category = "movies" if resource.kind == "movie" else "shows"

		simkl_status = self._map_status(status.status)
		if simkl_status is None:
			return

		resp = requests.post(
			"https://api.simkl.com/sync/add-to-list",
			json={
				category: [
					{
						"to": simkl_status,
						"watched_at": watch_date.isoformat()
						if status.status == Status.COMPLETED
						else None,
						"title": resource.name,
						"year": resource.year,
						"ids": self._map_external_ids(resource.external_id),
					}
				]
			},
			headers={
				"Authorization": f"Bearer {user.external_id["simkl"].token.access_token}",
				"simkl-api-key": self._api_key,
			},
		)
		logging.info("Simkl response: %s %s", resp.status_code, resp.text)

	def _map_status(self, status: Status):
		match status:
			case Status.COMPLETED:
				return "completed"
			case Status.WATCHING:
				return "watching"
			case Status.COMPLETED:
				return "completed"
			case Status.PLANNED:
				return "plantowatch"
			case Status.DELETED:
				# do not delete items on simkl, most of deleted status are for a rewatch.
				return None
			case _:
				return None

	def _map_external_ids(self, ids: dict[str, MetadataID]):
		return {service: id.data_id for service, id in ids.items()} | {
			"tmdb": int(ids["themoviedatabase"].data_id)
			if "themoviedatabase" in ids
			else None
		}
