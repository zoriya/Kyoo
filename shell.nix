{pkgs ? import <nixpkgs> {}}:
pkgs.mkShell {
  name = "kyoo";
  inputsFrom = [
    (import ./api/shell.nix {inherit pkgs;})
    (import ./auth/shell.nix {inherit pkgs;})
    (import ./chart/shell.nix {inherit pkgs;})
    (import ./front/shell.nix {inherit pkgs;})
    (import ./scanner/shell.nix {inherit pkgs;})
    (import ./transcoder/shell.nix {inherit pkgs;})
  ];

  # env vars aren't inherited from the `inputsFrom`
  SHARP_FORCE_GLOBAL_LIBVIPS = 1;
  UV_PYTHON_PREFERENCE = "only-system";
  UV_PYTHON = pkgs.python313;
}
