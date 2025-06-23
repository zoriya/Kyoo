{pkgs ? import <nixpkgs> {}}:
pkgs.mkShell {
  packages = with pkgs; [
    go
    wgo
    go-migrate
    sqlc
    go-swag
    # for psql in cli (+ pgformatter for sql files)
    postgresql_15
    pgformatter
    # to run tests
    # hurl
  ];
}
