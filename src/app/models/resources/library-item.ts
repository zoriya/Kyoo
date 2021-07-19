import { IResource } from "./resource";

export enum ItemType
{
	Show,
	Movie,
	Collection
}

export interface LibraryItem extends IResource
{
	title: string;
	overview: string;
	status: string;
	trailerUrl: string;
	startAir: Date;
	endAir: Date;
	poster: string;
	type: ItemType;
}
