import { Show } from "./show";
import { Episode } from "./episode";
import { People } from "./people";
import { Studio } from "./studio";
import { Genre } from "./genre";

export interface SearchResut
{
	query: string;
	shows: Show[];
	episodes: Episode[];
	people: People[];
	genrwes: Genre[];
	studios: Studio[];
}
