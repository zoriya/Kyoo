{pkgs ? import <nixpkgs> {}}: let
  python = pkgs.python313.withPackages (ps:
    with ps; [
      fastapi
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
in
  pkgs.mkShell {
    packages = with pkgs; [
      python
      ruff
      fastapi-cli
    ];
  }
