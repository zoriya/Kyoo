import { Season } from "./season";
import { Genre } from "./genre";
import { People } from "./people";
import { Studio } from "./studio";

export interface Show
{
  slug: string;
  title: string;
  Aliases: string[];
  overview: string;
  genres: Genre[];
  status: string;
  studio: Studio;
  directors: People[];
  people: People[];
  seasons: Season[];
  trailerUrl: string;
  isCollection: boolean;

  startYear: number;
  endYear : number;

  externalIDs: string;
}
