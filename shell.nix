{pkgs ? import <nixpkgs> {}}:
pkgs.mkShell {
  packages = with pkgs; [
    nodejs-16_x
    nodePackages.yarn
    (with dotnetCorePackages;
      combinePackages [
        sdk_6_0
        aspnetcore_6_0
      ])
  ];
}
