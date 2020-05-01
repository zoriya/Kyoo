import {ExternalID} from "./external-id";

export interface People
{
	slug: string;
	name: string;
	role: string; 
	type: string; 

	externalIDs: ExternalID[];
}
