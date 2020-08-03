import { Show } from "./show";
import {IResource} from "./resources/resource";

export interface Collection extends IResource
{
	name: string;
	poster: string;
	overview: string;
	startYear: number,
	endYear: number,
	shows: Show[];
}
