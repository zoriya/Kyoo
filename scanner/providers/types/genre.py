from enum import Enum


class Genre(str, Enum):
	ACTION = "Action"
	ADVENTURE = "Adventure"
	ANIMATION = "Animation"
	COMEDY = "Comedy"
	CRIME = "Crime"
	DOCUMENTARY = "Documentary"
	DRAMA = "Drama"
	FAMILY = "Family"
	FANTASY = "Fantasy"
	HISTORY = "History"
	HORROR = "Horror"
	MUSIC = "Music"
	MYSTERY = "Mystery"
	ROMANCE = "Romance"
	SCIENCE_FICTION = "ScienceFiction"
	THRILLER = "Thriller"
	WAR = "War"
	WESTERN = "Western"

	def to_kyoo(self):
		return self.value
