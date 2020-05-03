import {Provider} from "./provider"

export interface ExternalID
{
	provider: Provider;
	dataID: string;
	link: string;
}