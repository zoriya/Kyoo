import {ExternalID} from "./external-id";

export interface Episode
{
	seasonNumber: number;
	episodeNumber: number;
	title: string;
	thumb: string;
	slug: string;
	overview: string;
	releaseDate;
	runtime: number;
	showTitle: string;
	externalIDs: ExternalID[];
}
