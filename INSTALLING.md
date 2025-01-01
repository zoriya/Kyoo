# Installing TLDR

1. Install docker & docker-compose
2. Download the
   [`docker-compose.yml`](https://github.com/zoriya/kyoo/releases/latest/download/docker-compose.yml) and
   [`.env`](https://raw.githubusercontent.com/zoriya/Kyoo/master/.env.example) files
3. Fill the `.env` file with your configuration options
4. Look at [Hardware Acceleration section](#Hardware-Acceleration) if you need it
5. Look at [FAQ](#FAQ) if you need it,
6. Run `docker compose up -d` and see kyoo at `http://localhost:8901`

# Installing

To install Kyoo, you need docker and docker-compose. Those can be installed from here for
[Linux](https://docs.docker.com/engine/install/)
[Mac](https://docs.docker.com/desktop/install/mac-install/)
or [Windows](https://docs.docker.com/desktop/install/windows-install/). Docker is used to run each services of Kyoo in
an isolated environment with all the dependencies they need.

Kyoo also needs 2 files to work properly. The first should be downloaded from the latest release artifact, the other needs to be filled in with your configurations.
Those files can be put in any directory of your choice.

Those files are:

- A `docker-compose.yml` (simply download docker-compose.yml from [the latest release](https://github.com/zoriya/kyoo/releases/latest/download/docker-compose.yml)).
- A `.env` file that you will need to **fill**. Look at the example [.env.example](https://raw.githubusercontent.com/zoriya/Kyoo/master/.env.example)

> If you want an explanation of what are those files, you can read the following:
> The `docker-compose.yml` file describes the different services of Kyoo, where they should be downloaded and their start order. \
> The `.env` file contains all the configuration options that the services in `docker-compose.yml` will read.

If you need hardware acceleration, look at [Hardware Acceleration section](#Hardware-Acceleration).
If you need custom volumes (because video directories are on different disks and you can't use raid, because you use network drives or another custom volume type), look at [Custom Volumes](#Custom-Volumes).

The next and last step is actually starting Kyoo. To do that, open a terminal in the same directory as the 3 configurations files
and run `docker compose up -d`.

Congratulation, everything is now ready to use Kyoo. You can navigate to `http://localhost:8901` on a web browser to see your instance of Kyoo.

# Updating

Updating Kyoo is exactly the same as installing it. Get an updated version of the `docker-compose.yml` file and
unsure that your `.env` contains all the options specified in the updated `.env.example` file.

After that, you will need to update Kyoo's services. For that, open a terminal in the configuration's directory and run
the command `docker compose pull`. You are now ready to restart Kyoo, you can run `docker compose up -d`.

# Uninstalling

To uninstall Kyoo, you need to open a terminal in the configuration's directory and run `docker compose down`. This will
stop Kyoo's services. You can then remove the configuration files.

# Hardware Acceleration

## VA-API (intel, amd)

First install necessary drivers on your system, when running `vainfo` you should have something like this:
```
libva info: VA-API version 1.20.0
libva info: Trying to open /run/opengl-driver/lib/dri/iHD_drv_video.so
libva info: Found init function __vaDriverInit_1_20
libva info: va_openDriver() returns 0
vainfo: VA-API version: 1.20 (libva 2.20.1)
vainfo: Driver version: Intel iHD driver for Intel(R) Gen Graphics - 23.3.5 ()
vainfo: Supported profile and entrypoints
      VAProfileH264Main               :	VAEntrypointVLD
      VAProfileH264Main               :	VAEntrypointEncSlice
      ...Truncated...
      VAProfileHEVCSccMain444_10      :	VAEntrypointVLD
      VAProfileHEVCSccMain444_10      :	VAEntrypointEncSliceLP
```
Kyoo will default to use your primary card (located at `/dev/dri/renderD128`). If you need to specify a secondary one, you
can use the `GOCODER_VAAPI_RENDERER` env-var to specify `/dev/dri/renderD129` or another one.

Then you can simply run kyoo using `docker compose --profile vaapi up -d` (notice the `--profile vaapi` added)
You can also add `COMPOSE_PROFILES=vaapi` to your `.env` instead of adding the `--profile` flag.

## Nvidia

To enable nvidia hardware acceleration, first install necessary drivers on your system.

Then, install the [nvidia-container-toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html), you can simply
follow the instructions on the official webpage or your distribution wiki.

To test if everything works, you can run `sudo docker run --rm --gpus all ubuntu nvidia-smi`. If your version of docker is older,
you might need to add `--runtime nvidia` like so: `sudo docker run --rm --runtime=nvidia --gpus all ubuntu nvidia-smi`

After that, you can now use `docker compose --profile nvidia up -d` to start kyoo with nvidia hardware acceleration (notice the `--profile nvidia` added).
You can also add `COMPOSE_PROFILES=nvidia` to your `.env` instead of adding the `--profile` flag.

Note that most nvidia cards have an artificial limit on the number of encodes. You can confirm your card limit [here](https://developer.nvidia.com/video-encode-and-decode-gpu-support-matrix-new).
This limit can also be removed by applying an [unofficial patch](https://github.com/keylase/nvidia-patch) to you driver.

# FAQ

## Custom volumes

To customize volumes, you can edit the `docker-compose.yml` manually.

For example, if your library is split into multiples paths you can edit the `volumes` section of **BOTH the transcoder and the scanner** like so:

```patch
 x-transcoder: &transcoder-base
   image: ghcr.io/zoriya/kyoo_transcoder:edge
   networks:
     default:
       aliases:
         - transcoder
   restart: unless-stopped
   env_file:
     - ./.env
   environment:
     - GOCODER_PREFIX=/video
   volumes:
-    - ${LIBRARY_ROOT}:/video:ro
+    - /my_path/number1:/video/1:ro
+    - /c/Users/Videos/:video/c:ro
     - ${CACHE_ROOT}:/cache
     - metadata:/metadata
```
You can also edit the volume definition to use advanced volume drivers if you need to access smb or network drives. Mounting a drive into your filesystem and binding it in this volume section is also a valid choice (especially for fuse filesystems like cloud drives for example).

Don't forget to **also edit the scanner's volumes** if you edit the transcoder's volume.

## Ignoring Directories
Kyoo supports excluding specific directories from scanning and monitoring by detecting the presence of a `.ignore` file. When a directory contains a `.ignore` file, Kyoo will recursively exclude that directory and all its contents from processing.

Example:
To exclude `/media/extras/**`, add a `.ignore` file:
```bash
touch /media/extras/.ignore
```
Kyoo will skip `/media/extras` and its contents in all future scans and monitoring events.

# OpenID Connect

Kyoo supports OpenID Connect (OIDC) for authentication. Please refer to the [OIDC.md](OIDC.md) file for more information.

<!-- vim: set wrap: -->
