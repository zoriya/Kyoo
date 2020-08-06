import { Show } from "./resources/show";
import { Episode } from "./resources/episode";
import { People } from "./resources/people";
import { Studio } from "./resources/studio";
import { Genre } from "./resources/genre";
import {Collection} from "./resources/collection";

export interface SearchResult
{
	query: string;
	collections: Collection[];
	shows: Show[];
	episodes: Episode[];
	people: People[];
	genres: Genre[];
	studios: Studio[];
}
