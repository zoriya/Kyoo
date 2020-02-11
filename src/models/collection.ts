import { Show } from "./show";

export interface Collection
{
	slug: string;
	name: string;
	poster: string;
	overview: string;
	startYear: number,
	endYear: number,
	shows: Show[];
}
