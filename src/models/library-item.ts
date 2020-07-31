import {IResource} from "./resources/resource";

export enum ItemType
{
	Show,
	Movie,
	Collection
}

export interface LibraryItem extends IResource
{
	title: string
	overview: string
	status: string
	trailerUrl: string
	startYear: number
	endYear: number
	poster: string
	type: ItemType
}