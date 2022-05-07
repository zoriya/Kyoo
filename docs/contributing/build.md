---
uid: build
title: Build
---

# Build

## Dependencies

To develop for Kyoo, you will need the **.NET 5.0 SDK**, **node** and **npm** for the webapp. If you want to build the transcoder, you will also need a cmake compatible environment.

## Building
To run the development server, simply open the .sln file with your favorite C# IDE (like Jetbrain's Rider or Visual Studio) and press run or you can use the CLI and use the ```dotnet run --project src/Kyoo.Host.Console --launch-profile "Console"``` command.
To pack the application, run the ```dotnet publish -c Release -o <build_path> Kyoo.Host.Console``` command. This will build the server, the webapp and the transcoder and output files in the <build_path> directory.

## Skipping parts
If you want, you can build kyoo without it's transcoder by running ```dotnet build '-p:SkipTranscoder=true'```. You are now responsible of bringing a transcoder dynamic library at the build location. If you don't bring one, the transcoder won't be available.

You can also disable the webapp build by running ```dotnet build '-p:SkipWebApp=true'```. Those two options can be combined by running ```dotnet build '-p:SkipTranscoder=true;SkipWebApp=true'```

