import { Show } from "./show";
import { Episode } from "./episode";
import { People } from "./people";
import { Studio } from "./studio";
import { Genre } from "./genre";
import {Collection} from "./collection";

export interface SearchResult
{
	query: string;
	collections: Collection[];
	shows: Show[];
	episodes: Episode[];
	people: People[];
	genrwes: Genre[];
	studios: Studio[];
}
