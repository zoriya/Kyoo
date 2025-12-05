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

  packages = [
    pkgs.devspace
  ];

  # env vars aren't inherited from the `inputsFrom`
  SHARP_FORCE_GLOBAL_LIBVIPS = 1;
  shellHook = ''
    export LD_LIBRARY_PATH=${pkgs.stdenv.cc.cc.lib}/lib:$LD_LIBRARY_PATH
  '';
  UV_PYTHON_PREFERENCE = "only-system";
  UV_PYTHON = pkgs.python313;
}
