import {ExternalID} from "../external-id";
import {IResource} from "./resource";

export interface Episode extends IResource
{
	seasonNumber: number;
	episodeNumber: number;
	title: string;
	thumb: string;
	overview: string;
	releaseDate;
	runtime: number;
	showTitle: string;
	externalIDs: ExternalID[];
}
