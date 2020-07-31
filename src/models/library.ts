import {IResource} from "./resources/resource";

export interface Library extends IResource
{
	id: number;
	slug: string;
	name: string;
}