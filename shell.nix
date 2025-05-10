{pkgs ? import <nixpkgs> {}}:
pkgs.mkShell {
  name = "kyoo";
  inputsFrom = [
    (import ./api/shell.nix {inherit pkgs;})
    (import ./auth/shell.nix {inherit pkgs;})
    (import ./back/shell.nix {inherit pkgs;})
    (import ./chart/shell.nix {inherit pkgs;})
    (import ./scanner/shell.nix {inherit pkgs;})
    (import ./transcoder/shell.nix {inherit pkgs;})
  ];

  # env vars aren't inherited from the `inputsFrom`
  SHARP_FORCE_GLOBAL_LIBVIPS = 1;
}
