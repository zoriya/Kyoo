{pkgs ? import <nixpkgs> {}}: let
  venvDir = "./scanner/.venv";
  python = pkgs.python312;
  pythonPkgs = ./scanner/requirements.txt;
  dotnet = with pkgs.dotnetCorePackages;
    combinePackages [
      sdk_7_0
      aspnetcore_7_0
    ];
in
  pkgs.mkShell {
    packages = with pkgs; [
      nodejs-18_x
      nodePackages.yarn
      nodePackages.eas-cli
      nodePackages.expo-cli
      dotnet
      python
      python312Packages.setuptools
      python312Packages.pip
      go
      wgo
      mediainfo
      libmediainfo
      ffmpeg
      postgresql_15
      eslint_d
      prettierd
      pgformatter
    ];

    DOTNET_ROOT = "${dotnet}";

    shellHook = ''
      # Install python modules
      SOURCE_DATE_EPOCH=$(date +%s)
      if [ ! -d "${venvDir}" ]; then
          ${python}/bin/python3 -m venv ${toString ./.}/${venvDir}
          source ${venvDir}/bin/activate
          export PIP_DISABLE_PIP_VERSION_CHECK=1
          pip install -r ${pythonPkgs} >&2
      else
          source ${venvDir}/bin/activate
      fi
    '';
  }
