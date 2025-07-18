{pkgs ? import <nixpkgs> {}}:
pkgs.mkShell {
  packages = with pkgs; [
    go
    wgo
    go-migrate
    go-swag
    # for psql in cli (+ pgformatter for sql files)
    postgresql_15
    pgformatter
    # to debug video files
    mediainfo
    ffmpeg-full
  ];
}
