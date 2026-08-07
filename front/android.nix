{pkgs ? import <nixpkgs> {
  config = {
    android_sdk.accept_license = true;
    allowUnfree = true;
  };
}}:
let
  # gradle modules ask for an exact ndk revision and try to sdkmanager-install it
  # when it is missing, which fails on the read-only store. expo pins the first
  # one for react-native, agp defaults to the second for everything else.
  ndkVersion = "27.1.12297006";
  agpNdkVersion = "27.0.12077973";

  androidComposition = pkgs.androidenv.composeAndroidPackages {
    cmdLineToolsVersion = "latest";
    platformToolsVersion = "latest";
    toolsVersion = "latest";
    emulatorVersion = "latest";

    # a few expo modules still pin the previous platform / build-tools, and a
    # missing component is an install attempt into the read-only store.
    platformVersions = [ "36" "35" ];
    buildToolsVersions = [ "36.0.0" "35.0.0" ];

    includeNDK = true;
    ndkVersions = [ ndkVersion agpNdkVersion ];
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
    bun
  ];

  ANDROID_HOME = sdkRoot;
  ANDROID_SDK_ROOT = sdkRoot;
  ANDROID_NDK_ROOT = "${sdkRoot}/ndk/${ndkVersion}";
  ANDROID_NDK_HOME = "${sdkRoot}/ndk/${ndkVersion}";
  JAVA_HOME = "${pkgs.jdk17}";

  EXPO_NO_TELEMETRY = "1";

  # agp downloads its own aapt2 from maven, an unpatched elf that cannot run on
  # nixos ("Daemon startup failed"). `org.gradle.project.<name>` system
  # properties become gradle project properties, which is the only way to spell
  # a dotted name like this one as an env var.
  GRADLE_OPTS = "-Dorg.gradle.project.android.aapt2FromMavenOverride=${sdkRoot}/build-tools/36.0.0/aapt2";

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
# to build & install on a real device (a chromecast plugged over usb, adb enabled
# in the developer options), which is the same command minus the avd:
# $ EXPO_TV=1 bunx expo run:android --device
# the dev build needs metro reachable from the device, over usb:
# $ adb reverse tcp:8081 tcp:8081
