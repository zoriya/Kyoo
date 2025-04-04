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
      bun
      pkg-config
      node-gyp
      vips
      hurl
    ];

    DOTNET_ROOT = "${dotnet}";

    SHARP_FORCE_GLOBAL_LIBVIPS = 1;
  }
