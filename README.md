# <img width="24px" src="./icons/icon-256x256.png" alt="Kyoo"> Kyoo
<p>
  <a href="https://github.com/AnonymusRaccoon/Kyoo/actions/workflows/build.yml"><img src="https://img.shields.io/github/workflow/status/AnonymusRaccoon/Kyoo/Build?style=flat-square" alt="Build status"></a>
  <a href="https://github.com/AnonymusRaccoon/Kyoo/actions/workflows/tests.yml"><img src="https://img.shields.io/github/workflow/status/AnonymusRaccoon/Kyoo/Testing?label=tests&style=flat-square" alt="Tests status"></a>
  <a href="https://github.com/users/AnonymusRaccoon/packages/container/package/kyoo"><img src="https://img.shields.io/github/workflow/status/AnonymusRaccoon/Kyoo/Docker?label=docker&style=flat-square" alt="Docker status"/></a>
  <a href="https://sonarcloud.io/dashboard?id=AnonymusRaccoon_Kyoo"><img src="https://img.shields.io/sonar/tests/AnonymusRaccoon_Kyoo?compact_message&server=https%3A%2F%2Fsonarcloud.io&style=flat-square" alt="Test report"></a>
  <a href="https://sonarcloud.io/dashboard?id=AnonymusRaccoon_Kyoo"><img src="https://img.shields.io/sonar/coverage/AnonymusRaccoon_Kyoo?server=https%3A%2F%2Fsonarcloud.io&style=flat-square" alt="Coverage"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/github/license/AnonymusRaccoon/Kyoo?style=flat-square" alt="License"></a>
</p>

Kyoo is an open-source media browser which allow you to stream your movies, tv-shows or anime.
It is an alternative to Plex, Emby or Jellyfin.

Kyoo has been created from scratch, it is not a fork. Everything is and always will be free and open-source.

Feel free to open issues or pull requests, all contribution are welcomed.

## Getting started

- [Installation](https://docs.kyoo.moe/start/install.html)
- [Api Documentation](https://demo.kyoo.moe/redoc)
- [Documentation (work in progress)](https://docs.kyoo.moe)
- [Contributing](./CONTRIBUTING.md)

## Features
 - Manage your movies, tv-series & anime
 - Download metadata automatically
 - Transmux files to make them available on every platform (Transcode coming soon)
 - Account system with a permission system
 - Handle subtitles natively with embedded fonts (ass, subrip or vtt)
 - Entirely free and works without internet (when metadata have already been downloaded)
 - Works on Linux, Windows, Docker and probably Mac
 - A powerful plugin system

## Live Demo

You can see a live demo with copyright-free movies here: [demo.kyoo.moe](https://demo.kyoo.moe).
Thanks to the [blender studio](https://www.blender.org/about/studio/) for providing open-source movies available for all.

The demo server is simply created using the following docker compose:

```yml
version: "3.8"

services:
    kyoo:
        image: ghcr.io/anonymusraccoon/kyoo:master
        restart: on-failure
        environment:
            - KYOO_DATADIR=/var/lib/kyoo
            - BASICS__PUBLICURL=https://demo.kyoo.moe
            - BASICS__MetadataInShow=false
            - DATABASE__ENABLED=postgres
            - DATABASE__CONFIGURATIONS__POSTGRES__SERVER=postgres
            - DATABASE__CONFIGURATIONS__POSTGRES__USER ID=kyoo
            - DATABASE__CONFIGURATIONS__POSTGRES__PASSWORD=kyooPassword
            - TVDB__APIKEY=TheTvDbApiKey
            - THE-MOVIEDB__APIKEY=TheMovieDbApiKey
        ports:
            - "80:5000"
        depends_on:
            - postgres
        volumes:
            - kyoo:/var/lib/kyoo
            - video:/video
    postgres:
        image: "postgres"
        restart: on-failure
        environment:
            - POSTGRES_USER=kyoo
            - POSTGRES_PASSWORD=kyooPassword
        volumes:
            - db:/var/lib/postgresql/data

volumes:
    kyoo:
    video:
    db:
```

## Screens

![Show](../screens/show.png?raw=true)
- - -
![Show Dropdown](../screens/show_dropdown.png?raw=true)
- - -
![Browse](../screens/browse.png?raw=true)
- - -
![Filters](../screens/filters.png?raw=true)
- - -
![People](../screens/people.png?raw=true)
- - -
![Player](../screens/player.png?raw=true)
- - -
![Search](../screens/search.png?raw=true)
