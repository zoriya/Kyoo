import {ExternalID} from "./external-id";
import {IResource} from "./resources/resource";

export interface People extends IResource
{
	name: string;
	role: string; 
	type: string; 

	externalIDs: ExternalID[];
}
