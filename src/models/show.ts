import { Season } from "./season";
import { Genre } from "./genre";
import { People } from "./people";
import { Studio } from "./studio";

export interface Show
{
	slug: string;
	title: string;
	aliases: string[];
	overview: string;
	genres: Genre[];
	status: string;
	studio: Studio;
	people: People[];
	seasons: Season[];
	trailerUrl: string;
	isCollection: boolean;
	isMovie: boolean;

	startYear: number;
	endYear : number;

	externalIDs: [string, string][];
}
