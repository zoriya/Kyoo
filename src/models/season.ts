import { Episode } from "./episode";

export interface Season
{
	seasonNumber: number;
	title: string;
	overview: string;
	episodes: Episode[];
}
