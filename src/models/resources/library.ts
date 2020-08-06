import {IResource} from "./resource";

export interface Library extends IResource
{
	id: number;
	slug: string;
	name: string;
}