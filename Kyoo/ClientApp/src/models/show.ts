import { Season } from "./season";

export interface Show
{
  id: number;
  slug: string;
  title: string;
  //IEnumerable < > Aliases;
  path: string;
  overview: string;
  trailer: string;
  //IEnumerable < > Genres;
  //Status ? Status;

  startYear: number;
  endYear : number;

  imgPrimary: string;
  imgThumb: string;
  imgLogo: string;
  imgBackdrop: string;

  externalIDs: string;

  seasons: Season[];
}
