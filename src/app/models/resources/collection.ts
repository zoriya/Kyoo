import { Show } from "./show";
import { IResource } from "./resource";

export interface Collection extends IResource
{
	name: string;
	poster: string;
	overview: string;
	startAir: Date;
	endAir: Date;
	shows: Show[];
}
