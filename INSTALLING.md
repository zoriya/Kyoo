# Installing

To install Kyoo, you need docker and docker-compose. Those can be installed from here for
[Linux](https://docs.docker.com/engine/install/)
[Mac](https://docs.docker.com/desktop/install/mac-install/)
or [Windows](https://docs.docker.com/desktop/install/windows-install/). Docker is used to run each services of Kyoo in
an isolated environment with all the dependencies they need.

Kyoo also needs 3 files to work properly. Two of them can simply be copy-pasted from this repository, the other needs to be filled in with your configurations.

Those 3 files are:
 - A `docker-compose.yml` (simply copy docker-compose.prod.yml from [here](https://raw.githubusercontent.com/zoriya/Kyoo/master/docker-compose.prod.yml)).
 - A `nginx.conf.template` copied from [here](https://raw.githubusercontent.com/zoriya/Kyoo/master/nginx.conf.template).
 - A `.env` file that you fill need to fill. Look at the example [.env.example](https://raw.githubusercontent.com/zoriya/Kyoo/master/.env.example)


> If you want an explanation of what are those files, you can read the following:
> The `docker-compose.yml` file describes the different services of Kyoo, where they should be downloaded and their start order. \
> The `nignx.conf.template` file describes which service will be called when accessing the URL of Kyoo. \
> The `.env` file contains all the configuration options that the services in `docker-compose.yml` will read.


To retrieve metadata, Kyoo will need to communicate with an external service. For now, that is `the movie database`.
For this purpose, you will need to get an API Key. For that, go to [themoviedb.org](https://www.themoviedb.org/) and create an account, then
go [here](https://www.themoviedb.org/settings/api) and copy the `API Key (v3 auth)`, paste it after the `THEMOVIEDB_APIKEY=` on the `.env` file.

The next and last step is actually starting Kyoo. To do that, open a terminal in the same directory as the 3 configurations files
and run `docker-compose up -d`.

Congratulation, everything is now ready to use Kyoo. You can navigate to `http://localhost:8901` on a web browser to see your instance of Kyoo.

# Updating

Updating Kyoo is exactly the same as installing it. Get an updated version of the `docker-compose.yml` and `nginx.conf.template` files and
unsure that your `.env` contains all the options specified in the updated `.env.example` file.

After that, you will need to update Kyoo's services. For that, open a terminal in the configuration's directory and run
the command `docker-compose pull`. You are now ready to restart Kyoo, you can run `docker-compose up -d`.

# Uninstalling

To uninstall Kyoo, you need to open a terminal in the configuration's directory and run `docker-compose down`. This will
stop Kyoo's services. You can then remove the configuration files.
