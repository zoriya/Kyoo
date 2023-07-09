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

import { QueryIdentifier, QueryPage, WatchItem, WatchItemP, useFetch } from "@kyoo/models";
import { Head } from "@kyoo/primitives";
import { useState, useEffect, ComponentProps } from "react";
import { Platform, Pressable, PressableProps, StyleSheet, View } from "react-native";
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

const query = (slug: string): QueryIdentifier<WatchItem> => ({
	path: ["watch", slug],
	parser: WatchItemP,
});

const mapData = (
	data: WatchItem | undefined,
	previousSlug?: string,
	nextSlug?: string,
): Partial<ComponentProps<typeof Hover>> & { isLoading: boolean } => {
	if (!data) return { isLoading: true };
	return {
		isLoading: false,
		name: data.isMovie ? data.name : `${episodeDisplayNumber(data, "")} ${data.name}`,
		showName: data.isMovie ? data.name! : data.showTitle,
		href: data ? (data.isMovie ? `/movie/${data.slug}` : `/show/${data.showSlug}`) : "#",
		poster: data.poster,
		qualities: data.link,
		subtitles: data.subtitles,
		chapters: data.chapters,
		fonts: data.fonts,
		previousSlug,
		nextSlug,
	};
};

const PressView =
	Platform.OS === "web"
		? View
		: ({
			onPointerDown,
			onMobilePress,
			...props
		}: PressableProps & { onMobilePress: PressableProps["onPress"] }) => (
			<Pressable focusable={false} onPress={(e) => onMobilePress?.(e)} {...props} />
		);

// Callback used to hide the controls when the mouse goes iddle. This is stored globally to clear the old timeout
// if the mouse moves again (if this is stored as a state, the whole page is redrawn on mouse move)
let mouseCallback: NodeJS.Timeout;
// Number of time the video has been pressed. Used to handle double click. Since there is only one player,
// this can be global and not in the state.
let touchCount = 0;
let touchTimeout: NodeJS.Timeout;

export const Player: QueryPage<{ slug: string }> = ({ slug }) => {
	const { css } = useYoshiki();
	const { t } = useTranslation();
	const router = useRouter();

	const [playbackError, setPlaybackError] = useState<string | undefined>(undefined);
	const { data, error } = useFetch(query(slug));
	const previous =
		data && !data.isMovie && data.previousEpisode
			? `/watch/${data.previousEpisode.slug}`
			: undefined;
	const next =
		data && !data.isMovie && data.nextEpisode ? `/watch/${data.nextEpisode.slug}` : undefined;

	useVideoKeyboard(data?.subtitles, data?.fonts, previous, next);

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

	if (error || playbackError)
		return (
			<>
				<Back isLoading={false} {...css({ position: "relative", bg: (theme) => theme.accent })} />
				<ErrorView error={error ?? { errors: [playbackError!] }} />
			</>
		);

	return (
		<>
			{data && (
				<Head
					title={
						data.isMovie
							? data.name
							: data.showTitle +
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
				image={data?.thumbnail}
				next={next}
				previous={previous}
			/>
			<PressView
				focusable={false}
				onMobilePress={(e) => {
					e.preventDefault();
					displayControls ? setMouseMoved(false) : show();
				}}
				onPointerDown={(e) => {
					e.preventDefault();
					if (e.nativeEvent.pointerType !== "mouse") {
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
				}}
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
					links={data?.link}
					setError={setPlaybackError}
					fonts={data?.fonts}
					onEnd={() => {
						if (!data) return;
						if (data.isMovie) router.push(`/movie/${data.slug}`);
						else
							router.push(
								data.nextEpisode ? `/watch/${data.nextEpisode.slug}` : `/show/${data.showSlug}`,
							);
					}}
					{...css(StyleSheet.absoluteFillObject)}
				/>
				<LoadingIndicator />
				<Hover
					{...mapData(data, previous, next)}
					onPointerEnter={(e) => {
						if (e.nativeEvent.pointerType === "mouse") setHover(true);
					}}
					onPointerLeave={(e) => {
						if (e.nativeEvent.pointerType === "mouse") setHover(false);
					}}
					onPointerDown={(e) => {
						// Prevent clicks on the hover to play/pause.
						e.preventDefault();
						e.stopPropagation();
					}}
					onMenuOpen={() => setMenuOpen(true)}
					onMenuClose={() => {
						// Disable hover since the menu overlay makes the mouseout unreliable.
						setHover(false);
						setMenuOpen(false);
					}}
					show={displayControls}
				/>
			</PressView>
		</>
	);
};

Player.getFetchUrls = ({ slug }) => [query(slug)];
