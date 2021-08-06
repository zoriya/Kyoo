# Kyoo
<p>
  <a href="https://github.com/AnonymusRaccoon/Kyoo/actions/workflows/build.yml"><img src="https://img.shields.io/github/workflow/status/AnonymusRaccoon/Kyoo/Build?style=flat-square" alt="Build status"></a>
  <a href="https://github.com/AnonymusRaccoon/Kyoo/actions/workflows/tests.yml"><img src="https://img.shields.io/github/workflow/status/AnonymusRaccoon/Kyoo/Testing?label=tests&style=flat-square" alt="Tests status"></a>
  <a href="https://github.com/users/AnonymusRaccoon/packages/container/package/kyoo"><img src="https://img.shields.io/github/workflow/status/AnonymusRaccoon/Kyoo/Docker?label=docker&style=flat-square"/></a>
  <a href="https://sonarcloud.io/dashboard?id=AnonymusRaccoon_Kyoo"><img src="https://img.shields.io/sonar/violations/AnonymusRaccoon_Kyoo?format=long&server=https%3A%2F%2Fsonarcloud.io&style=flat-square" alt="Analysis report"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/github/license/AnonymusRaccoon/Kyoo?style=flat-square" alt="License"></a>
</p>

Kyoo is an open-souce media browser which allow you to stream your movies, tv-shows or animes.
It is an alternative to Plex, Emby or Jellyfin.

Kyoo has been created from scratch, it is not a fork. Everything is and always will be free and open-source.

Feel free to open issues or pull requests, all contribution are welcomed.

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


## Installation

On any system, you will need a running postgres server where Kyoo can connect. The connection's informations can be specified on the appsettings.json file, the default connection settings
use the user `kyoo` with the password `kyooPassword` on the server at `127.0.0.1:5432` (the default postgres url).

You can find nightly prebuild zipped version here:
 - [Windows](https://nightly.link/AnonymusRaccoon/Kyoo/workflows/build/master/kyoo_windows.zip)
 - [MacOS](https://nightly.link/AnonymusRaccoon/Kyoo/workflows/build/master/kyoo_macos.zip)
 - [Linux](https://nightly.link/AnonymusRaccoon/Kyoo/workflows/build/master/kyoo_linux.zip)

For arch based, debian based or rpm compatible distributions, a package is automatically created and can be downloaded:
 - [Arch](https://nightly.link/AnonymusRaccoon/Kyoo/workflows/build/master/kyoo_arch.zip)
 - [Debian](https://nightly.link/AnonymusRaccoon/Kyoo/workflows/build/master/kyoo_debian.zip)
 - [RPM](https://nightly.link/AnonymusRaccoon/Kyoo/workflows/build/master/kyoo_rpm.zip)

A docker file is also available and an up-to-date docker image is available at: `ghcr.io/anonymusraccoon/kyoo:master`. An example docker-compose image is available at the root of the repository. You can customise it to feet your needs and use a prebuild image or you can build it from source. To do that, clone the repository with the `--recurse` flag and run `docker-compose up `.

## Repositories

This is the main repository for Kyoo. Here, you will find all the server's code, the build process & the login page.

In the [Kyoo.WebApp](https://github.com/AnonymusRaccoon/Kyoo.WebApp) repository, you will find the code of the web app (created usint angular).

In the [Kyoo.Transcoder](https://github.com/AnonymusRaccoon/Kyoo.Transcoder) repository, you will find the C code that handle transcoding, transmuxing & subtitles/codecs extractions from media files.

Both of theses repository are needed to fully build Kyoo, when you clone this repository you should use the --recurse argument of git like so: ```git clone https://github.com/AnonymusRaccoon/Kyoo --recurse```.

## Development & Build

To develop for Kyoo, you will need the .NET 5.0 SDK and node & npm for the webapp. If you want to build the transcoder, you will also need a cmake compatible environement.

To run the development server, simply open the .sln file with your favorite C# IDE (like Jetbrain's Rider or Visual Studio) and press run or you can use the CLI and use the ```dotnet run -p Kyoo``` command.
To pack the application, run the ```dotnet publish -c Release -o <build_path> Kyoo``` command. This will build the server, the webapp and the transcoder and output files in the <build_path> directory.

If you want, you can build kyoo without it's transcoder by running ```dotnet build '-p:SkipTranscoder=true'```. You are now responsible of bringing a transcoder dynamic library at the build location. If you don't bring one, the transcoder won't be available.

You can also disable the webapp build by running ```dotnet build '-p:SkipWebApp=true'```. Those two options can be combined by running ```dotnet build '-p:SkipTranscoder=true;SkipWebApp=true'```

## Plugins

You can create plugins for Kyoo. To do that, create a C# Library project targetting the .Net Core 5 and install the [Kyoo.Common](https://www.nuget.org/packages/Kyoo.Common) package and implement the IPlugin interface.

You can create Tasks which can be started manually or automatically at startup or every X hours. You can also create metadata providers that will be used to get informations about shows, seasons, episodes & people.
You can find an exemple of metadata provider [here](https://github.com/AnonymusRaccoon/Kyoo.TheMovieDB).
