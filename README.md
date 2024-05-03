# <img width="24px" src="./icons/icon-256x256.png" alt=""> Kyoo

Kyoo is a self-hosted media server focused on video content (Movies, Series & Anime). It is an alternative to Jellyfin or Plex.

It aims to have a low amount of maintenance needed (no folder structure required nor manual metadata edits). Media not being scanned correctly (even with weird names) is considered a bug.

Kyoo does not have a plugin system and aim to have every features built-in (see [#Features](#-features) for the list).

![Kyoo in Action](https://raw.githubusercontent.com/zoriya/kyoo/screens/home.png)

## 🌐 Getting Started

- **[Installation](./INSTALLING.md):** Basic installation guidelines, how to start Kyoo, enable OIDC or hardware transcoding.
- **[Join the discord](https://discord.gg/E6Apw3aFaA):** Ask questions, talk about the development, feature you might want or bugs you might encounter.
- **[API Documentation](https://kyoo.zoriya.dev/api/doc):** The API to integrate Kyoo with other services, if you have any questions, please ask on github or discord!
- **[Contributing](./CONTRIBUTING.md):** Feel free to open issues, submit pull requests, and contribute to making Kyoo even better. We need you!

[![](https://discord.com/api/guilds/1216460898139635753/widget.png?style=banner2)](https://discord.gg/zpA74Qpvj5)

## 🚀 Features

- **Dynamic Transcoding:** Transcode your media to any quality, change on the fly with auto quality, and seek instantly without waiting for the transcoder.

- **Video Preview Thumbnails:** Simply hover the video's progress bar and see a preview of the video.

- **Meilisearch-Powered Search:** Advanced, typo-resilient search system powered by Meilisearch.

- **OIDC Connection:** Connect using any OIDC compliant service (Google, Discord, Authelia, you name it).

- **Watch List Scrubbing Support:** Your watch list is automatically synced to connected services (SIMKL and soon others [#351](https://github.com/zoriya/Kyoo/issues/351), [#352](https://github.com/zoriya/Kyoo/issues/352)). No need to manually mark episodes as watched.

- **Download and Offline Support:** Download videos to watch them without internet access, you progress will automatically be synced next time your devices goes online.

- **Enhanced Subtitle Support:** Subtitles are important, Kyoo supports SSA/ASS and uses the video's embedded fonts when available.

- **Anime Name Parsing**: While there are still some issues (see [#466](https://github.com/zoriya/Kyoo/issues/466)), Kyoo will match weird anime names (like `[Some-Stuffs] Jojo's Bizarre Adventure Stone Ocean 24 (1920x1080 Blu-Ray Opus) [2750810F].mkv`) without issue.

- **Cloud Native:** Still an ongoing effort (see [#357](https://github.com/zoriya/Kyoo/issues/357)) but Kyoo is made with the idea that it could run distributed or standalone, on an RPI or on huge home-datacenters.

## 📺 Clients

Clients is a bit part of media servers but for now, Kyoo's focus is on features. Only a web version and an android apps are available for now. The front is written with react-native (expo) so adapting for others platform is possible. Here is a rough roadmap of clients supports:
- Today: Web & Android
- End of 2024: Chromecast support
- Summer 2025: Android TV app

Apple devices are not planned for now because I do not own any of their device, and it requires $100/year.

If you would like to have a client sooner or on devices not listed on the roadmap, come hang on the discord and consider contributing to Kyoo.

## 📜 Why another media-browser?

From a technical standpoint, both Jellyfin and Plex lean on SQLite and confine everything within a single container, Kyoo takes a different route. We're not afraid to bring in additional containers when it makes sense – whether for specialized features like Meilisearch powering our search system or for scalability, as seen with our transcoder.

Kyoo embraces the "setup once, forget about it" philosophy. Unlike Plex and Jellyfin, we don't burden you with manual file renaming or specific folder structures. Kyoo seamlessly works with files straight from your download directory, minimizing the maintenance headache for server admins.

Kyoo narrows its focus to movies, TV shows, and anime streaming. No music, ebooks, or games – just pure cinematic delight.

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
