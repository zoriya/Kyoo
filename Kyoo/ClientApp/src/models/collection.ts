import { Show } from "./show";

export interface Collection
{
  slug: string;
  name: string;
  overview: string;
  shows: Show[];
}
