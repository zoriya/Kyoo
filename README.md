# Kyoo

Kyoo is an open-souce media browser which allow you to stream your movies, tv-shows or animes.
It is an alternative to Plex, Emby or Jellyfin.

Kyoo has been created from scratch, it is not a fork. Everything is and always will be free and open-source.

Feel free to open issues or pull requests, all contribution are welcomed.

## Installation

If you are using a linux distribution with acess to the AUR, simply install the kyoo-bin package. **COMMING SOON**. The package is not published on the AUR yet but you can built it easily with makepkg. To do so, clone the repo & run `makepkg -i` inside the `install/aur` directory.

If you are running another linux distribution or macos, you will need to build the package from source. To do that, look [here](#development--build).

If you are on windows, you can't install Kyoo for now. (Everything should work fine except for the transcoder. I haven't made the pipeline for MSVC).

## Repositories

This is the main repository for Kyoo. Here, you will find all the server's code, the build process & the login page.

In the [Kyoo.WebApp](https://github.com/AnonymusRaccoon/Kyoo.WebApp) repository, you will find the code of the web app (created usint angular).

In the [Kyoo.Transcoder](https://github.com/AnonymusRaccoon/Kyoo.Transcoder) repository, you will find the C code that handle transcoding, transmuxing & subtitles/codecs extractions from media files.

Both of theses repository are needed to fully build Kyoo, when you clone this repository you should use the --recurse argument of git like so: ```git clone https://github.com/AnonymusRaccoon/Kyoo --recurse```.

## Development & Build

To develop for Kyoo, you will need the .NET 5.0 SDK, node & npm for the webapp and cmake & gcc for the transcoder.

To run the development server, simply open the .sln file with your favorite C# IDE (like Jetbrain's Rider or Visual Studio) and press run or you can use the CLI and use the ```dotnet run -p Kyoo``` command.

To pack the application, run the ```dotnet publish -c Release -o <build_path> Kyoo``` command. This will build the server, the webapp and the transcoder and output files in the <build_path> directory.

## Plugins

You can create plugins for Kyoo. To do that, create a C# Library project targetting the .Net Core 3.1 and install the [Kyoo.Common](https://www.nuget.org/packages/Kyoo.Common) package and implement the IPlugin interface.

You can create Tasks which can be started manually or automatically at startup or every X hours. You can also create metadata providers that will be used to get informations about shows, seasons, episodes & people.
You can find an exemple of metadata provider [here](https://github.com/AnonymusRaccoon/Kyoo.TheMovieDB).
