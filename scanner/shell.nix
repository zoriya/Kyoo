{pkgs ? import <nixpkgs> {}}: let
  python = pkgs.python313.withPackages (ps:
    with ps; [
      fastapi
      pydantic
      guessit
      aiohttp
      watchfiles
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
