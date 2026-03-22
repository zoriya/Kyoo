# <img width="32px" src="./front/public/gh-icon.png" alt=""> Kyoo


Kyoo is a self-hosted media server focused on video content (Movies, Series & Anime). It is an alternative to Jellyfin or Plex.

It aims to have a low amount of maintenance needed (no folder structure required nor manual metadata edits). Media not being scanned correctly (even with weird names) is considered a bug.

Kyoo does not have a plugin system and aim to have every features built-in (see [#Features](#-features) for the list).

![Kyoo in Action](https://raw.githubusercontent.com/zoriya/kyoo/screens/home.png)

## 🌐 Getting Started

- **[Installation](./INSTALLING.md):** Basic installation guidelines, how to start Kyoo, enable OIDC or hardware transcoding.
- **[Join the discord](https://discord.gg/E6Apw3aFaA):** Ask questions, talk about the development, feature you might want or bugs you might encounter.
- **[API Documentation](https://kyoo.zoriya.dev/swagger):** The API to integrate Kyoo with other services, if you have any questions, please ask on GitHub or Discord!
- **[Contributing](./CONTRIBUTING.md):** Feel free to open issues, submit pull requests, and contribute to making Kyoo even better. We need you!

[![](https://discord.com/api/guilds/1216460898139635753/widget.png?style=banner2)](https://discord.gg/zpA74Qpvj5)

## 🚀 Features

- **Dynamic Transcoding:** Transcode your media to any quality, change on the fly with auto quality, and seek instantly without waiting for the transcoder.

- **Video Preview Thumbnails:** Simply hover the video's progress bar and see a preview of the video.

- **Enhanced Subtitle Support:** Subtitles are important, Kyoo supports PGS/VODSUB and SSA/ASS and uses the video's embedded fonts when available.

- **Anime Name Parsing**: Kyoo will match weird anime names (like `[Some-Stuffs] Jojo's Bizarre Adventure Stone Ocean 24 (1920x1080 Blu-Ray Opus) [2750810F].mkv`) without issue.

- **Helm Chart:** Deploy Kyoo to your Kubernetes cluster today!  There is an official Helm chart.  Multiple replicas is a WIP!

- ~**OIDC Connection:** Connect using any OIDC compliant service (Google, Discord, Authelia, you name it).~ (soon, not reimplemented in v5 yet)

- ~**Watch List Scrubbing Support:** Your watch list is automatically synced to connected services (SIMKL and soon others [#351](https://github.com/zoriya/Kyoo/issues/351), [#352](https://github.com/zoriya/Kyoo/issues/352)). No need to manually mark episodes as watched.~ (soon, not reimplemented in v5 yet)

- ~**Download and Offline Support:** Download videos to watch them without internet access, your progress will automatically be synced next time your devices goes online.~ (soon, not reimplemented in v5 yet)

## 📺 Clients

Kyoo currently supports Web and ~Android clients~ (soon, not yet in v5), with additional platforms being thought about.

Don't see your client? Kyoo is focused on adding features, but welcomes contributors! The frontend is built with React-Native and Expo. Come hang and develop with us on Discord.

Support for Apple devices (iOS, tvOS) is not currently planned due to buying hardware and yearly developer fee (~$100).

## 📖 Translations

If Kyoo is not available on your language, you can use [weblate](https://hosted.weblate.org/engage/kyoo/) to add translations easily.

[![Translation status](https://hosted.weblate.org/widget/kyoo/kyoo/multi-auto.svg)](https://hosted.weblate.org/engage/kyoo/)

## 📜 Why another media-browser?

From a technical standpoint, both Jellyfin and Plex lean on SQLite and confine everything within a single container, Kyoo takes a different route. We're not afraid to bring in additional containers when it makes sense, as seen with our transcoder.

Kyoo embraces the “setup once, forget about it” philosophy. Unlike Plex and Jellyfin, we don't burden you with manual file renaming or specific folder structures. Kyoo seamlessly works with files straight from your download directory, minimizing the maintenance headache for server admins.

Kyoo narrows its focus to movies, TV shows, and anime streaming. No music, e-books, or games – just pure cinematic delight.

## 🔗 Live Demo

Curious to see Kyoo in action? Check out our live demo featuring copyright-free movies at [kyoo.zoriya.dev](https://kyoo.zoriya.dev). Special thanks to the Blender Studio for providing open-source movies available for all.

## 👀 Screens

![Web Show](https://raw.githubusercontent.com/zoriya/kyoo/screens/show-details.png)

![Desktop Scrubber](https://raw.githubusercontent.com/zoriya/kyoo/screens/hover-scrubber.png)

![Touch Scrubber](https://raw.githubusercontent.com/zoriya/kyoo/screens/bottom-scrubber.png)

![Collection](https://raw.githubusercontent.com/zoriya/kyoo/screens/collection.png)

![List](https://raw.githubusercontent.com/zoriya/kyoo/screens/list.png)

<p align="center">
	<img
		src="https://raw.githubusercontent.com/zoriya/kyoo/screens/android-movie.png"
		alt="Android Movie"
		width="350"
	/>
</p>
Ready to elevate your streaming experience? Dive into Kyoo now! 🎬🎉

<!-- vim: set wrap: -->
