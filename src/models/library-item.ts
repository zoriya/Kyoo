enum ItemType
{
	Show,
	Movie,
	Collection
}

export interface LibraryItem
{
	ID: number
	Slug: string
	Title: string
	Overview: string
	Status: string
	TrailerUrl: string
	StartYear: number
	EndYear: number
	Poster: string
	Type: ItemType
}