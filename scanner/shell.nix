{pkgs ? import <nixpkgs> {}}: let
  python = pkgs.python313.withPackages (ps:
    with ps; [
      fastapi
      pydantic
      guessit
      aiohttp
      watchfiles
      langcodes
      asyncpg
    ]);
in
  pkgs.mkShell {
    packages = with pkgs; [
      python
      ruff
      fastapi-cli
      pgformatter
    ];
  }
