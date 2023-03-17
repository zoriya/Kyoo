{pkgs ? import <nixpkgs> {}}: let
  pythonPackages = p:
    with p; [
      guessit
    ];
in
  pkgs.mkShell {
    packages = with pkgs; [
      nodejs-16_x
      nodePackages.yarn
      (with dotnetCorePackages;
        combinePackages [
          sdk_6_0
          aspnetcore_6_0
        ])
      (python3.withPackages pythonPackages)
    ];
  }
