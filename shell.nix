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
      langcodes
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
      ffmpeg-full
      postgresql_15
      pgformatter
      biome
      go-migrate
    ];

    DOTNET_ROOT = "${dotnet}";
  }
