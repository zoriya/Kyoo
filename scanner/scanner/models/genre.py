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
	SCIENCE_FICTION = "science-fiction"
	THRILLER = "thriller"
	WAR = "war"
	WESTERN = "western"
	KIDS = "kids"
	REALITY = "reality"
	POLITICS = "politics"
	SOAP = "soap"
	TALK = "talk"

	def to_kyoo(self):
		return self.value
