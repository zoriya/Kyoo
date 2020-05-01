import {ExternalID} from "./external-id";

export interface Episode
{
	seasonNumber: number;
	episodeNumber: number;
	title: string;
	thumb: string;
	link: string;
	overview: string;
	releaseDate;
	runtime: number;
	showTitle: string;
	externalIDs: ExternalID[];
}
