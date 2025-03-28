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

      # robotframework
      # restinstance needs to be packaged
    ]);
  dotnet = with pkgs.dotnetCorePackages;
    combinePackages [
      sdk_8_0
      aspnetcore_8_0
    ];
in
  pkgs.mkShell {
    packages = with pkgs; [
      nodejs-18_x
      nodePackages.yarn
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
      kubernetes-helm
      go-migrate
      sqlc
      go-swag
      robotframework-tidy
      bun
      pkg-config
      node-gyp
      vips
    ];

    DOTNET_ROOT = "${dotnet}";

    SHARP_FORCE_GLOBAL_LIBVIPS = 1;
  }
