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
in
  pkgs.mkShell {
    packages = with pkgs; [
      python
      ruff
    ];
  }
