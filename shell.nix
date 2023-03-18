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
    python3
    python3Packages.venvShellHook
  ];

  # Run this command, only after creating the virtual environment
  venvDir = "./.venv";
  postVenvCreation = ''
    unset SOURCE_DATE_EPOCH
    pip install -r ./scanner/requirements.txt
  '';

  # Now we can execute any commands within the virtual environment.
  # This is optional and can be left out to run pip manually.
  postShellHook = ''
    # allow pip to install wheels
    unset SOURCE_DATE_EPOCH
  '';
}
