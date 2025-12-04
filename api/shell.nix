{pkgs ? import <nixpkgs> {}}:
pkgs.mkShell {
  packages = with pkgs; [
    bun
    biome
    # for psql to debug from the cli
    postgresql_18
    # to build libvips (for sharp)
    nodejs
    node-gyp
    pkg-config
    vips
  ];

  SHARP_FORCE_GLOBAL_LIBVIPS = 1;
  shellHook = ''
    export LD_LIBRARY_PATH=${pkgs.stdenv.cc.cc.lib}/lib:$LD_LIBRARY_PATH
  '';
}
