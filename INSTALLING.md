# Installing TLDR

1. Install docker & docker-compose
2. Download the
   [`docker-compose.yml`](https://raw.githubusercontent.com/zoriya/Kyoo/master/docker-compose.prod.yml),
   [`nginx.conf.template`](https://raw.githubusercontent.com/zoriya/Kyoo/master/nginx.conf.template) and
   [`.env`](https://raw.githubusercontent.com/zoriya/Kyoo/master/.env.example) files
3. Fill the `.env` file with your configuration options (and an API Key from [themoviedb.org](https://www.themoviedb.org/))
4. Look at [Hardware Acceleration section](#Hardware-Acceleration) if you need it
4. Run `docker compose up -d` and see kyoo at `http://localhost:8901`

# Installing

To install Kyoo, you need docker and docker-compose. Those can be installed from here for
[Linux](https://docs.docker.com/engine/install/)
[Mac](https://docs.docker.com/desktop/install/mac-install/)
or [Windows](https://docs.docker.com/desktop/install/windows-install/). Docker is used to run each services of Kyoo in
an isolated environment with all the dependencies they need.

Kyoo also needs 3 files to work properly. Two of them can simply be copy-pasted from this repository, the other needs to be filled in with your configurations.
Those files can be put in any directory of your choice.

Those 3 files are:

- A `docker-compose.yml` (simply copy docker-compose.prod.yml from [here](https://raw.githubusercontent.com/zoriya/Kyoo/master/docker-compose.prod.yml)).
- A `nginx.conf.template` copied from [here](https://raw.githubusercontent.com/zoriya/Kyoo/master/nginx.conf.template).
- A `.env` file that you will need to **fill**. Look at the example [.env.example](https://raw.githubusercontent.com/zoriya/Kyoo/master/.env.example)

> If you want an explanation of what are those files, you can read the following:
> The `docker-compose.yml` file describes the different services of Kyoo, where they should be downloaded and their start order. \
> The `nignx.conf.template` file describes which service will be called when accessing the URL of Kyoo. \
> The `.env` file contains all the configuration options that the services in `docker-compose.yml` will read.

To retrieve metadata, Kyoo will need to communicate with an external service. For now, that is `the movie database`.
For this purpose, you will need to get an API Key. For that, go to [themoviedb.org](https://www.themoviedb.org/) and create an account, then
go [here](https://www.themoviedb.org/settings/api) and copy the `API Key (v3 auth)`, paste it after the `THEMOVIEDB_APIKEY=` on the `.env` file.

If you need hardware acceleration, look at [Hardware Acceleration section](#Hardware-Acceleration) if you need it

The next and last step is actually starting Kyoo. To do that, open a terminal in the same directory as the 3 configurations files
and run `docker-compose up -d`.

Congratulation, everything is now ready to use Kyoo. You can navigate to `http://localhost:8901` on a web browser to see your instance of Kyoo.

# Updating

Updating Kyoo is exactly the same as installing it. Get an updated version of the `docker-compose.yml` and `nginx.conf.template` files and
unsure that your `.env` contains all the options specified in the updated `.env.example` file.

After that, you will need to update Kyoo's services. For that, open a terminal in the configuration's directory and run
the command `docker-compose pull`. You are now ready to restart Kyoo, you can run `docker-compose up -d`.

You can also enable automatic updates via an external tool like [watchtower](https://containrrr.dev/watchtower/).
TLDR: `docker run -d --name watchtower -e WATCHTOWER_CLEANUP=true -e WATCHTOWER_POLL_INTERVAL=86400 -v /var/run/docker.sock:/var/run/docker.sock containrrr/watchtower`

# Uninstalling

To uninstall Kyoo, you need to open a terminal in the configuration's directory and run `docker-compose down`. This will
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
can use the `GOTRANSCODER_VAAPI_RENDERER` env-var to specify `/dev/dri/renderD129` or another one.

Then you can simply run kyoo using `docker compose --profile vaapi up -d` (notice the `--profile vaapi` added)

## Nvidia

To enable nvidia hardware acceleration, first install necessary drivers on your system.

Then, install the [nvidia-container-toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html), you can simply
follow the instructions on the official webpage or your distribution wiki.

To test if everything works, you can run `sudo docker run --rm --gpus all ubuntu nvidia-smi`. If your version of docker is older,
you might need to add `--runtime nvidia` like so: `sudo docker run --rm --runtime=nvidia --gpus all ubuntu nvidia-smi`

After that, you can now use `docker compose --profile nvidia up -d` to start kyoo with nvidia hardware acceleration (notice the `--profile nvidia` added).

Note that most nvidia cards have an artificial limit on the number of encodes. You can confirm your card limit [here](https://developer.nvidia.com/video-encode-and-decode-gpu-support-matrix-new).
This limit can also be removed by applying an [unofficial patch](https://github.com/keylase/nvidia-patch) to you driver.
