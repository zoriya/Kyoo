from abc import abstractmethod, abstractproperty

from ..models.user import User
from ..models.show import Show
from ..models.movie import Movie
from ..models.episode import Episode
from ..models.watch_status import WatchStatus


class Service:
	@abstractproperty
	def name(self) -> str:
		raise NotImplementedError

	@abstractproperty
	def enabled(self) -> bool:
		return True

	@abstractmethod
	def update(self, user: User, resource: Movie | Show | Episode, status: WatchStatus):
		raise NotImplementedError
