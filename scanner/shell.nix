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
      pyjwt
      python-slugify
    ]);
in
  pkgs.mkShell {
    packages = with pkgs; [
      python
      uv
      ruff
      fastapi-cli
      pgformatter
    ];

    UV_PYTHON_PREFERENCE = "only-system";
    UV_PYTHON = pkgs.python313;
  }
