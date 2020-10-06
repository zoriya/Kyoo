import {ExternalID} from "../external-id";
import {IResource} from "./resource";
import {Show} from "./show";

export interface People extends IResource
{
	name: string;
	role: string; 
	type: string;
	poster: string;

	shows: Show;
	externalIDs: ExternalID[];
}