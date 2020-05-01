import { Episode } from "./episode";
import {ExternalID} from "./external-id";

export interface Season
{
	seasonNumber: number;
	title: string;
	overview: string;
	episodes: Episode[];
	externalIDs: ExternalID[]
}
