# Kyoo

Kyoo is an open-souce media browser which allow you to stream your movies, tv-shows or animes.
It is an alternative to Plex, Emby or Jellyfin.

Kyoo has been created from scratch, it is not a fork. Everything is and always will be free and open-source.

Feel free to open issues or pull requests, all contribution are welcomed.

## Repositories

This is the main repository for Kyoo. Here, you will find all the server's code, the build process & the login page.

In the [Kyoo.WebApp](https://github.com/AnonymusRaccoon/Kyoo.WebApp) repository, you will find the code of the web app (created usint angular).

In the [Kyoo.Transcoder](https://github.com/AnonymusRaccoon/Kyoo.Transcoder) repository, you will find the C code that handle transcoding, transmuxing & subtitles/codecs extractions from media files.

Both of theses repository are needed to fully build Kyoo, when you clone this repository you should use the --recurse argument of git like so: ```git clone https://github.com/AnonymusRaccoon/Kyoo --recurse```.

## Development & Build

To develop for Kyoo, you will need the .NET 3.1 SDK, node & npm for the webapp and cmake & gcc for the transcoder.

To run the development server, simply open the .sln file with your favorite C# IDE (like Jetbrain's Rider or Visual Studio) and press run or you can use the CLI and use the ```dotnet run -p Kyoo``` command.

To pack the application, run the ```dotnet publish -c Release -o <build_path> Kyoo``` command. This will build the server, the webapp and the transcoder and output files in the <build_path> directory.
