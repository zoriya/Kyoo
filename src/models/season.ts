import { Episode } from "./episode";
import {ExternalID} from "./external-id";
import {IResource} from "./resources/resource";

export interface Season extends IResource
{
	seasonNumber: number;
	title: string;
	overview: string;
	episodes: Episode[];
	externalIDs: ExternalID[]
}
