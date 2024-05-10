{pkgs ? import <nixpkgs> {}}: let
  python = pkgs.python312.withPackages (ps:
    with ps; [
      guessit
      aiohttp
      jsons
      watchfiles
      pika
      aio-pika
      requests
      dataclasses-json
      msgspec
    ]);
  dotnet = with pkgs.dotnetCorePackages;
    combinePackages [
      sdk_8_0
      aspnetcore_8_0
      aspnetcore_6_0
    ];
in
  pkgs.mkShell {
    packages = with pkgs; [
      nodejs-18_x
      nodePackages.yarn
      nodePackages.eas-cli
      nodePackages.expo-cli
      dotnet
      csharpier
      python
      ruff
      go
      wgo
      mediainfo
      libmediainfo
      ffmpeg-full
      postgresql_15
      pgformatter
      biome
    ];

    DOTNET_ROOT = "${dotnet}";
  }
