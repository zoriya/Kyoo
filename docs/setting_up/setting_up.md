---
uid: setting_up
title: Setting Up
---

# Welcome to Kyoo

Hi, and welcome to Kyoo, you are about to embark on this wonderful journey that is media management & streaming

To setup Kyoo, you need to make sure you installed it, then we'll configure some settings, maybe rearrange your files. This shouldn't take long if you are used to manage JSON files, and regex.

## Settings.json

If you installed Kyoo on Linux/macOS, their should be a ```/var/lib/Kyoo``` directory
If you are on a Windows, it should be ```C:\ProgramData```

Inside this folder, we'll find (almost) everything we need. The most important file is ```settings.json```

At first, it'll look like [this](https://github.com/AnonymusRaccoon/Kyoo/blob/master/src/Kyoo.Host.Generic/settings.json)

We are going to take a look at the fields you might want to change to tailor Kyoo to your configuration:

- ```basics```
  - ```url```: The port on which Kyoo will be exposed
  - ```publicUrl```: The full URL for Kyoo. **Warning** The port must match with ```url```
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
  - ```enabled```: Which database to use. Either ```sqlite``` (by default) or ```postgres```. SQLite is easier to use & manage if you don't have an SQL server on your machine

- ```tasks```
  - ```scheduled```: An object with keys being the name of an automation task, with a value being the interval between each task of the same type.
    - The available keys can be found at ```publicUrl/api/tasks``` (as 'slug')
    - The values must be formatted like ```HH:MM:SS``
    **For Example** in the default configuration, a file scan task will be executed every 24 hours
  - ```parallels```: The number (as a string) of tasks that can be run at the same time. To avoid conflicts, we recommend leaving the value at ```1```

## Using a Container