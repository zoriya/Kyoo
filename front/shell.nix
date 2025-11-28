{pkgs ? import <nixpkgs> {}}:
pkgs.mkShell {
  packages = with pkgs; [
    bun
    biome
    nodePackages.eas-cli
  ];
}

