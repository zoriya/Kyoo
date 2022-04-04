---
uid: setting_up
title: Setting Up
---

# Welcome to Kyoo

Hi, and welcome to Kyoo, you are about to embark on this wonderful journey that is media management & streaming

To setup Kyoo, you need to make sure you installed it, then we'll configure some settings, maybe rearrange your files. This shouldn't take long if you are used to manage JSON files, and regex.

## settings.json

If you installed Kyoo on Linux/macOS, their should be a ```/var/lib/Kyoo``` directory
If you are on a Windows, it should be ```C:\ProgramData\Kyoo```

Inside this folder, we'll find (almost) everything we need. The most important file is ```settings.json```

At first, it'll look like [this](https://github.com/AnonymusRaccoon/Kyoo/blob/master/src/Kyoo.Host.Generic/settings.json)

We are going to take a look at the fields you might want to change to tailor Kyoo to your configuration:

- ```basics```
  - ```url```: The port on which Kyoo will be exposed
  - ```publicUrl```: The full URL for Kyoo.
  For the 3 following fields, the path are relative to the directory ```settings.json``` is in
  - ```pluginsPath```: The directory where the plugins are stored
  - ```transmuxPath```: The directory where the transmux-ed video are stored (used as a cache)
  - ```transcodePath```: The directory where the transcoded video are stored (used as a cache)
  - ```metadataInShow```: A boolean telling if the Movie/Show metadata (posters, extracted subtitles, Chapters) will be stored in the same directory as the video, in an ```Extra``` directory, or in the ```metadataPath```.
  For example, if ```metadataInShow``` is true, your file tree wil look something like this:
  
  ```bash
  /my-movies
  |
  -- My First Movie/
    |
    -- My First Movie.mp4
    -- Extra/
      |
      -- poster.jpe
      -- etc...
  ```

  **Warning** Therefore, if your shows are not in individual folders, it is recommended to set ```metadataInShow``` to ```false```. If you don't, all the shows will share the same metadata we are sure you don't want that ;)

- ```database```
  - ```enabled```: Which database to use. Either ```sqlite``` (by default) or ```postgres```. SQLite is easier to use & manage if you don't have an SQL server on your machine. However, if you have a large amount of videos, we recommend using Postgres, which is more powerful to manage large databases

- ```tasks```
  - ```parallels```: The number of tasks that can be run at the same time. If the values is not ```1```, the behavior is not implemented.
  - ```scheduled```: An object with keys being the name of an automation task, with a value being the interval between each task of the same type.
    - The available keys can be found at ```publicUrl/api/tasks``` (as 'slug')
    - The values must be formatted like ```HH:MM:SS``
    **For Example** in the default configuration, a file scan task will be executed every 24 hours

- ```media```
  - ```regex```: An array of String to match files using Regex. The Regex must have the following groups:
    - ```Collection```: The name of the collection. For example, you can move all the movie from a same saga in one directory, the collection's name will be the directory's. If the movie is at the root of the library, no collection will be created.
    - ```Show```: the name of the show/movie
    - ```StartYear``` (optional): the start year for a TV Series, or Year for a movie, used to get the correct metadata in provider
    - ```Season``` (for TV Series): An integer being the number of the season
    - ```Episode``` (for TV Series): An integer being the number of the episode in the season
    - ```Absolute``` (optional if the two groups above are in the regex): The absolute number of the episode (from episode 1x01, ignoring seasons)
  - ```subtitleRegex```: Same as ```regex```, but to find Subtitles files.
    - ```Language```: A String from 1 to 3 characters long defining the language of the subtitles
    - ```Default```: If present, will set the subtitle as default track
    - ```Forced```: If present, will set the subtitles as forced track

- ```tvdb```
  - ```apikey```: The API key that will be used to interact with the TVDB's API. See [there](https://thetvdb.com/api-information) to get one

- ```themoviedb```
  - ```apikey```: The API key that will be used to interact with TMDB's API. See [there](https://developers.themoviedb.org/3/getting-started/introduction) to get one

## Using a Container

If you use Kyoo from a container, we recommend using the docker-compose file from [here](https://github.com/AnonymusRaccoon/Kyoo) and doing the following actions before launching the container:

- If you use Postgres, configure the fields ```DATABASE__CONFIGURATIONS_*```
- If you use SQLite, set the ```DATABASE__ENABLED``` to ```sqlite```
- Set the ```*APIKEY``` values
- Map the folder ```/var/lib/kyoo``` to a directory on your host, so you can access files easily, and it'll be persistent
- Map the folder ```/video``` to the media directory
- If you use Postgres, map ```/var/lib/postgresql/data``` to the host's Postgres server data folder

If you don't have a previous Kyoo configuration, we recommend using Postgres.

## Configuring Libraries

You are now ready to launch Kyoo for the first time!
But before being able to see your favorite shows & movies, we need to configure the libraries: With Kyoo, you can separate your shows into libraries, for example to split TV Series from Movies,  Anime from Live-Action Series, Concerts from Documentaries.

First, you must open the server. To do so, execute the Kyoo.Host.Console binary found in the install directory.
If everything looks normal, no error message will appear, just log messages.

Then, we are going to interact with Kyoo's API. To create a library, you must do the following request for each library you want to make:
  
- POST Request
- At ```publicUrl/api/libraries``` (```publicUrl``` is in ```settings.json```)
- Content-Type: ```application/json```
- Body:

    ```json
    {
        "name": "$KYOO_LIBRARY_NAME", // The name of the Library
        "slug": "$KYOO_LIBRARY_SLUG", // The unique identifier of the Library, can be $KYOO_LIBRARY_NAME if it's unique 
        "paths": ["$KYOO_LIBRARY_PATH"], // Paths of directories to scan for shows in library
        "providers": [
            {"slug": "the-moviedb"}, // Remove if you don't want to use this provider
            {"slug": "the-tvdb"} // Remove if you don't want to use this provider
        ]
    }
    ```

Now that you created your libraries, you can do a simple GET request to ```publicUrl/api/task/scan``` to scan for videos in all the libraries.

Once the scan is over, ```Task finished: Scan Libraries``` will be displayed! You are now ready to use Kyoo!
