{pkgs ? import <nixpkgs> {}}: let
  venvDir = "./scanner/.venv";
  pythonPkgs = ./scanner/requirements.txt;
in
  pkgs.mkShell {
    packages = with pkgs; [
      nodejs-16_x
      nodePackages.yarn
      nodePackages.eas-cli
      nodePackages.expo-cli
      (with dotnetCorePackages;
        combinePackages [
          sdk_6_0
          aspnetcore_6_0
        ])
      python3
      python3Packages.pip
      cargo
      cargo-watch
      rustfmt
      rustc
	  pkgconfig
	  openssl
    ];

    RUST_SRC_PATH = "${pkgs.rust.packages.stable.rustPlatform.rustLibSrc}";

    shellHook = ''
      # Install python modules
      SOURCE_DATE_EPOCH=$(date +%s)
      if [ ! -d "${venvDir}" ]; then
          ${pkgs.python3}/bin/python3 -m venv ${toString ./.}/${venvDir}
          source ${venvDir}/bin/activate
          export PIP_DISABLE_PIP_VERSION_CHECK=1
          pip install -r ${pythonPkgs} >&2
      else
          source ${venvDir}/bin/activate
      fi
    '';
  }
