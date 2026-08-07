{pkgs ? import <nixpkgs> {
  config = {
    android_sdk.accept_license = true;
    allowUnfree = true;
  };
}}:
let
  ndkVersion = "27.1.12297006";

  androidComposition = pkgs.androidenv.composeAndroidPackages {
    cmdLineToolsVersion = "latest";
    platformToolsVersion = "latest";
    toolsVersion = "latest";
    emulatorVersion = "latest";

    platformVersions = [ "36" ];
    buildToolsVersions = [ "36.0.0" ];

    includeNDK = true;
    ndkVersions = [ ndkVersion ];
    cmakeVersions = [ "3.22.1" ];

    includeEmulator = true;
    includeSystemImages = true;
    systemImageTypes = [ "android-tv" ];
    abiVersions = [ "x86_64" ];

    includeSources = false;
  };
  androidSdk = androidComposition.androidsdk;
  sdkRoot = "${androidSdk}/libexec/android-sdk";
in
pkgs.mkShell {
  packages = with pkgs; [
    jdk17
    androidSdk
    android-tools
  ];

  ANDROID_HOME = sdkRoot;
  ANDROID_SDK_ROOT = sdkRoot;
  ANDROID_NDK_ROOT = "${sdkRoot}/ndk/${ndkVersion}";
  ANDROID_NDK_HOME = "${sdkRoot}/ndk/${ndkVersion}";
  JAVA_HOME = "${pkgs.jdk17}";

  EXPO_NO_TELEMETRY = "1";

  # the bundled qt only ships an xcb platform plugin, so on wayland it fails over
  # to xwayland on its own and loses track of its gl color buffers.
  QT_QPA_PLATFORM = "xcb";

  shellHook = ''
    export ANDROID_USER_HOME="''${XDG_CONFIG_HOME:-$HOME/.config}/android"
    export ANDROID_AVD_HOME="$ANDROID_USER_HOME/avd"
  '';
}

# to create an emulator (--device is required, the default profile is a 320x640
# portrait screen the tv launcher can't draw on, which just shows a black screen):
# $ avdmanager create avd -n tv -k "system-images;android-36;android-tv;x86_64" --device tv_1080p
# to open it:
# $ emulator -avd tv -gpu host
# to build & install the app on it
# $ EXPO_TV=1 bunx expo run:android
# or $ adb install -r ~/downloads/kyoo-dev-tv.apk 
