# Scanner

## Workflow (for v5, not current)

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
             kind: movie | episode | trailer | interview | ...,
             name: string,
             year: number | null,
             season?: number,
             episode?: number,
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
             kind: movie | episode | trailer | interview | ...,
             name: string,
             year: number | null,
             season?: number,
             episodes?: number[],
             absolutes?: number[],
             externalId: Record<string, {showId, season, number}[]>,
             remap: {
                 from: "thexem",
                 oldSeason: number,
                 oldEpisodes: number[],
              },
             ...
          },
     }
     ```
 - If kind is episode, try to find the serie's id on kyoo (using the previously fetched data from `/videos`):
   - if another video in the list of already registered videos has the same `kind`, `name` & `year`, assume it's the same
   - if a match is found, add to the video's json:
   ```json5
   {
       entries: (uuid | slug | {
           show: uuid | slug,
           season: number,
           episode: number,
           externalId?: Record<string, {showId, season, number}> // takes priority over season/episode for matching if we have one
       })[],
   }
   ```
 - Scanner pushes everything to the api in a single post `/videos` call
 - Api registers every video in the database
 - For each video without an associated entry, the guess data + the video's id is sent to the Matcher via a queue.
 - Matcher retrieves metadata from the movie/serie + ALL episodes/seasons (from an external provider)
 - Matcher pushes every metadata to the api (if there are 1000 episodes but only 1 video, still push the 1000 episodes)

