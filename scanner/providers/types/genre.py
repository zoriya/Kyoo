from enum import Enum


class Genre(str, Enum):
	ACTION = "action"
	ADVENTURE = "adventure"
	ANIMATION = "animation"
	COMEDY = "comedy"
	CRIME = "crime"
	DOCUMENTARY = "documentary"
	DRAMA = "drama"
	FAMILY = "family"
	FANTASY = "fantasy"
	HISTORY = "history"
	HORROR = "horror"
	MUSIC = "music"
	MYSTERY = "mystery"
	ROMANCE = "romance"
	SCIENCE_FICTION = "scienceFiction"
	THRILLER = "thriller"
	WAR = "war"
	WESTERN = "western"

	def to_kyoo(self):
		return {"name": self}
