{pkgs ? import <nixpkgs> {}}: let
  dotnet = with pkgs.dotnetCorePackages;
    combinePackages [
      sdk_8_0
      aspnetcore_8_0
    ];
in
  pkgs.mkShell {
    packages = with pkgs; [
      dotnet
      csharpier
    ];

    DOTNET_ROOT = "${dotnet}";
  }
