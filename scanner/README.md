# Scanner

## Workflow

In order of action:

 - Scanner gets `/videos` & scan file system to list all new videos
 - Scanner guesses as much as possible from filename/path ALONE (no external database query).
   - Format should be:
     ```json5
     {
         path: string,
         version: number,
         part: number | null,
         rendering: sha(path except version & part),
         guess: {
             from: "guessit"
             kind: movie | episode | extra
             title: string,
             years?: number[],
             episodes?: {season?: number, episode: number}[],
             ...
          },
     }
     ```

     - Apply remaps from lists (AnimeList + thexem). Format is now:
     ```json5
     {
         path: string,
         version: number,
         part: number | null,
         rendering: sha(path except version & part),
         guess: {
             from: "anilist",
             kind: movie | episode | extra
             name: string,
             years: number[],
             episodes?: {season?: number, episode: number}[],
             externalId: Record<string, {showId, season, number}[]>,
             history: {
                 from: "guessit"
                 kind: movie | episode | extra
                 title: string,
                 years?: number[],
                 episodes?: {season?: number, episode: number}[],
              },
             ...
          },
     }
     ```
 - Try to find the series id on kyoo (using the previously fetched data from `/videos`):
   - if another video in the list of already registered videos has the same `kind`, `name` & `year`, assume it's the same
   - if a match is found, add to the video's json:
   ```json5
   {
       entries: (
         | { slug: string }
         | { movie: uuid | string }
         | { serie: uuid | slug, season: number, episode: number }
         | { serie: uuid | slug, order: number }
         | { serie: uuid | slug, special: number }
         | { externalId?: Record<string, {serieId, season, number}> }
         | { externalId?: Record<string, {dataId}> }
       })[],
   }
   ```
 - Scanner pushes everything to the api in a single post `/videos` call
 - Api registers every video in the database & return the list of videos not matched to an existing serie/movie.
 - Scanner adds every non-matched video to a queue

For each item in the queue, the scanner will:
 - retrieves metadata from the movie/serie + ALL episodes/seasons (from an external provider)
 - pushes every metadata to the api (if there are 1000 episodes but only 1 video, still push the 1000 episodes)

<!-- vim: set expandtab : -->
