/*
 * Kyoo - A portable and vast media library solution.
 * Copyright (c) Kyoo.
 *
 * See AUTHORS.md and LICENSE file in the project root for full license information.
 *
 * Kyoo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * Kyoo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Kyoo. If not, see <https://www.gnu.org/licenses/>.
 */

import {
	Episode,
	EpisodeP,
	Movie,
	MovieP,
	QueryIdentifier,
	QueryPage,
	WatchInfo,
	WatchInfoP,
	useFetch,
} from "@kyoo/models";
import { Head } from "@kyoo/primitives";
import { useState, useEffect, ComponentProps } from "react";
import { Platform, StyleSheet, View, PointerEvent as NativePointerEvent } from "react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "solito/router";
import { useAtom } from "jotai";
import { useYoshiki } from "yoshiki/native";
import { Back, Hover, LoadingIndicator } from "./components/hover";
import { fullscreenAtom, playAtom, Video } from "./state";
import { episodeDisplayNumber } from "../details/episode";
import { useVideoKeyboard } from "./keyboard";
import { MediaSessionManager } from "./media-session";
import { ErrorView } from "../fetch";

type Item = (Movie & { type: "movie" }) | (Episode & { type: "episode" });

const query = (type: string, slug: string): QueryIdentifier<Item> =>
	type === "episode"
		? {
				path: ["episode", slug],
				params: {
					fields: ["nextEpisode", "previousEpisode", "show"],
				},
				parser: EpisodeP.transform((x) => ({ ...x, type: "episode" })),
		  }
		: {
				path: ["movie", slug],
				parser: MovieP.transform((x) => ({ ...x, type: "movie" })),
		  };
const infoQuery = (type: string, slug: string): QueryIdentifier<WatchInfo> => ({
	path: ["video", type, slug, "info"],
	parser: WatchInfoP,
});

const mapData = (
	data: Item | undefined,
	info: WatchInfo | undefined,
	previousSlug?: string,
	nextSlug?: string,
): Partial<ComponentProps<typeof Hover>> & { isLoading: boolean } => {
	if (!data || !info) return { isLoading: true };
	return {
		isLoading: false,
		name: data.type === "movie" ? data.name : `${episodeDisplayNumber(data, "")} ${data.name}`,
		showName: data.type === "movie" ? data.name! : data.show!.name,
		href: data ? (data.type === "movie" ? `/movie/${data.slug}` : `/show/${data.show!.slug}`) : "#",
		poster: data.type === "movie" ? data.poster : data.show!.poster,
		subtitles: info.subtitles,
		audios: info.audios,
		chapters: info.chapters,
		fonts: info.fonts,
		previousSlug,
		nextSlug,
	};
};

// Callback used to hide the controls when the mouse goes iddle. This is stored globally to clear the old timeout
// if the mouse moves again (if this is stored as a state, the whole page is redrawn on mouse move)
let mouseCallback: NodeJS.Timeout;
// Number of time the video has been pressed. Used to handle double click. Since there is only one player,
// this can be global and not in the state.
let touchCount = 0;
let touchTimeout: NodeJS.Timeout;

export const Player: QueryPage<{ slug: string; type: "episode" | "movie" }> = ({ slug, type }) => {
	const { css } = useYoshiki();
	const { t } = useTranslation();
	const router = useRouter();

	const [playbackError, setPlaybackError] = useState<string | undefined>(undefined);
	const { data, error } = useFetch(query(type, slug));
	const { data: info, error: infoError } = useFetch(infoQuery(type, slug));
	const previous =
		data && data.type === "episode" && data.previousEpisode
			? `/watch/${data.previousEpisode.slug}`
			: undefined;
	const next =
		data && data.type === "episode" && data.nextEpisode
			? `/watch/${data.nextEpisode.slug}`
			: undefined;

	useVideoKeyboard(info?.subtitles, info?.fonts, previous, next);

	const [isFullscreen, setFullscreen] = useAtom(fullscreenAtom);
	const [isPlaying, setPlay] = useAtom(playAtom);
	const [showHover, setHover] = useState(false);
	const [mouseMoved, setMouseMoved] = useState(false);
	const [menuOpenned, setMenuOpen] = useState(false);

	const displayControls = showHover || !isPlaying || mouseMoved || menuOpenned;
	const show = () => {
		setMouseMoved(true);
		if (mouseCallback) clearTimeout(mouseCallback);
		mouseCallback = setTimeout(() => {
			setMouseMoved(false);
		}, 2500);
	};
	useEffect(() => {
		if (Platform.OS !== "web") return;
		const handler = (e: PointerEvent) => {
			if (e.pointerType !== "mouse") return;
			show();
		};

		document.addEventListener("pointermove", handler);
		return () => document.removeEventListener("pointermove", handler);
	});

	useEffect(() => {
		if (Platform.OS !== "web" || !/Mobi/i.test(window.navigator.userAgent)) return;
		setFullscreen(true);
		return () => {
			setFullscreen(false);
		};
	}, [setFullscreen]);

	const onPointerDown = (e: NativePointerEvent) => {
		if (Platform.OS === "web") e.preventDefault();
		if (Platform.OS !== "web" || e.nativeEvent.pointerType !== "mouse") {
			displayControls ? setMouseMoved(false) : show();
			return;
		}
		touchCount++;
		if (touchCount == 2) {
			touchCount = 0;
			setFullscreen(!isFullscreen);
			clearTimeout(touchTimeout);
		} else
			touchTimeout = setTimeout(() => {
				touchCount = 0;
			}, 400);
		setPlay(!isPlaying);
	};

	// When the controls hide, remove focus so space can be used to play/pause instead of triggering the button
	// It also serves to hide the tooltip.
	useEffect(() => {
		if (Platform.OS !== "web") return;
		if (!displayControls && document.activeElement instanceof HTMLElement)
			document.activeElement.blur();
	}, [displayControls]);

	if (error || infoError || playbackError)
		return (
			<>
				<Back isLoading={false} {...css({ position: "relative", bg: (theme) => theme.accent })} />
				<ErrorView error={error ?? infoError ?? { errors: [playbackError!] }} />
			</>
		);

	return (
		<>
			{data && (
				<Head
					title={
						data.type === "movie"
							? data.name
							: data.show!.name +
							  " " +
							  episodeDisplayNumber({
									seasonNumber: data.seasonNumber,
									episodeNumber: data.episodeNumber,
									absoluteNumber: data.absoluteNumber,
							  })
					}
					description={data.overview}
				/>
			)}
			<MediaSessionManager
				title={data?.name ?? t("show.episodeNoMetadata")}
				image={data?.thumbnail?.high}
				next={next}
				previous={previous}
			/>
			<View
				onPointerLeave={(e) => {
					if (e.nativeEvent.pointerType === "mouse") setMouseMoved(false);
				}}
				{...css({
					flexGrow: 1,
					flexShrink: 1,
					bg: "black",
					// @ts-ignore Web only
					cursor: displayControls ? "unset" : "none",
				})}
			>
				<Video
					links={data?.links}
					subtitles={info?.subtitles}
					setError={setPlaybackError}
					fonts={info?.fonts}
					onPointerDown={(e) => onPointerDown(e)}
					onEnd={() => {
						if (!data) return;
						if (data.type === "movie")
							router.replace(`/movie/${data.slug}`, undefined, {
								experimental: { nativeBehavior: "stack-replace", isNestedNavigator: false },
							});
						else
							router.replace(
								data.nextEpisode ? `/watch/${data.nextEpisode.slug}` : `/show/${data.show!.slug}`,
								undefined,
								{ experimental: { nativeBehavior: "stack-replace", isNestedNavigator: false } },
							);
					}}
					{...css(StyleSheet.absoluteFillObject)}
				/>
				<LoadingIndicator />
				<Hover
					{...mapData(data, info, previous, next)}
					onPointerEnter={(e) => {
						if (Platform.OS !== "web" || e.nativeEvent.pointerType === "mouse") setHover(true);
					}}
					onPointerLeave={(e) => {
						if (e.nativeEvent.pointerType === "mouse") setHover(false);
					}}
					onPointerDown={(e) => {
						if (!displayControls) {
							onPointerDown(e);
							if (Platform.OS === "web") e.preventDefault();
						}
					}}
					onMenuOpen={() => setMenuOpen(true)}
					onMenuClose={() => {
						// Disable hover since the menu overlay makes the mouseout unreliable.
						setHover(false);
						setMenuOpen(false);
					}}
					show={displayControls}
					{...css({
						// @ts-ignore Web only
						cursor: "unset",
					})}
				/>
			</View>
		</>
	);
};

Player.getFetchUrls = ({ slug, type }) => [query(type, slug), infoQuery(type, slug)];
