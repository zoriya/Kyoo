import { ExternalID } from "../external-id";
import { IResource } from "./resource";
import { Show } from "./show";

export interface Episode extends IResource
{
	seasonNumber: number;
	episodeNumber: number;
	title: string;
	thumbnail: string;
	overview: string;
	releaseDate: string;
	runtime: number;
	show: Show;
	externalIDs: ExternalID[];
}
