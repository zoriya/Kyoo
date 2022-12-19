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
import { useState, useEffect, PointerEvent as ReactPointerEvent, ComponentProps } from "react";
import { PointerEvent, StyleSheet, View } from "react-native";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useRouter } from "solito/router";
import { percent, useYoshiki } from "yoshiki/native";
import { Hover, LoadingIndicator } from "./components/hover";
import { fullscreenAtom, playAtom, Video } from "./state";
import { episodeDisplayNumber } from "../details/episode";
import { useVideoKeyboard } from "./keyboard";
import { MediaSessionManager } from "./media-session";
import { ErrorView } from "../fetch";

// Callback used to hide the controls when the mouse goes iddle. This is stored globally to clear the old timeout
// if the mouse moves again (if this is stored as a state, the whole page is redrawn on mouse move)
let mouseCallback: NodeJS.Timeout;

const query = (slug: string): QueryIdentifier<WatchItem> => ({
	path: ["watch", slug],
	parser: WatchItemP,
});

const mapData = (
	data: WatchItem | undefined,
	previousSlug?: string,
	nextSlug?: string,
): Partial<ComponentProps<typeof Hover>> => {
	if (!data) return {};
	return {
		name: data.isMovie ? data.name : `${episodeDisplayNumber(data, "")} ${data.name}`,
		showName: data.isMovie ? data.name : data.showTitle,
		href: data ? (data.isMovie ? `/movie/${data.slug}` : `/show/${data.showSlug}`) : "#",
		poster: data.poster,
		subtitles: data.subtitles,
		chapters: data.chapters,
		fonts: data.fonts,
		previousSlug,
		nextSlug,
	};
};


export const Player: QueryPage<{ slug: string }> = ({ slug }) => {
	const { css } = useYoshiki();

	const { data, error } = useFetch(query(slug));
	const previous =
		data && !data.isMovie && data.previousEpisode
			? `/watch/${data.previousEpisode.slug}`
			: undefined;
	const next =
		data && !data.isMovie && data.nextEpisode ? `/watch/${data.nextEpisode.slug}` : undefined;

	// const { playerRef, videoProps, onVideoClick } = useVideoController(data?.link);
	// useSubtitleController(playerRef, data?.subtitles, data?.fonts);
	// useVideoKeyboard(data?.subtitles, data?.fonts, previous, next);

	const router = useRouter();
	const setFullscreen = useSetAtom(fullscreenAtom);
	const [isPlaying, setPlay] = useAtom(playAtom);
	const [showHover, setHover] = useState(false);
	const [mouseMoved, setMouseMoved] = useState(false);
	const [menuOpenned, setMenuOpen] = useState(false);

	const displayControls = showHover || !isPlaying || mouseMoved || menuOpenned;
	// const mouseHasMoved = () => {
	// 	setMouseMoved(true);
	// 	if (mouseCallback) clearTimeout(mouseCallback);
	// 	mouseCallback = setTimeout(() => {
	// 		setMouseMoved(false);
	// 	}, 2500);
	// };
	// useEffect(() => {
	// 	const handler = (e: PointerEvent) => {
	// 		if (e.pointerType !== "mouse") return;
	// 		mouseHasMoved();
	// 	};

	// 	document.addEventListener("pointermove", handler);
	// 	return () => document.removeEventListener("pointermove", handler);
	// });

	// useEffect(() => {
	// 	setPlay(true);
	// }, [slug, setPlay]);
	// useEffect(() => {
	// 	if (!/Mobi/i.test(window.navigator.userAgent)) return;
	// 	setFullscreen(true);
	// 	return () => setFullscreen(false);
	// }, [setFullscreen]);

	if (error) return <ErrorView error={error} />;

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
				title={data?.name}
				image={data?.thumbnail}
				next={next}
				previous={previous}
			/>
			{/* <style jsx global>{` */}
			{/* 	::cue { */}
			{/* 		background-color: transparent; */}
			{/* 		text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000; */}
			{/* 	} */}
			{/* `}</style> */}
			<View
				// onMouseLeave={() => setMouseMoved(false)}
				{...css({
					flexGrow: 1,
					// @ts-ignore
					// cursor: displayControls ? "unset" : "none",
					bg: "black",
				})}
			>
				<Video
					links={data?.link}
					videoStyle={{ width: percent(100), height: percent(100) }}
					{...css(StyleSheet.absoluteFillObject)}
					// onClick={onVideoClick}
					// onPointerDown={(e: PointerEvent) => {
					// 	if (e.type === "mouse") {
					// 		onVideoClick();
					// 	} else if (mouseMoved) {
					// 		setMouseMoved(false);
					// 	} else {
					// 		// mouseHasMoved();
					// 	}
					// }}
					// onEnded={() => {
					// 	if (!data) return;
					// 	if (data.isMovie) router.push(`/movie/${data.slug}`);
					// 	else
					// 		router.push(
					// 			data.nextEpisode ? `/watch/${data.nextEpisode.slug}` : `/show/${data.showSlug}`,
					// 		);
					// }}
				/>
				{/* <LoadingIndicator /> */}
				<Hover
					{...mapData(data, previous, next)}
					// onPointerOver={(e: ReactPointerEvent<HTMLElement>) => {
					// 	if (e.pointerType === "mouse") setHover(true);
					// }}
					// onPointerOut={() => setHover(false)}
					onMenuOpen={() => setMenuOpen(true)}
					onMenuClose={() => {
						// Disable hover since the menu overlay makes the mouseout unreliable.
						setHover(false);
						setMenuOpen(false);
					}}
					// sx={
					// 	displayControls
					// 		? {
					// 				visibility: "visible",
					// 				opacity: 1,
					// 				transition: "opacity .2s ease-in",
					// 		  }
					// 		: {
					// 				visibility: "hidden",
					// 				opacity: 0,
					// 				transition: "opacity .4s ease-out, visibility 0s .4s",
					// 		  }
					// }
				/>
			</View>
		</>
	);
};

// Player.getFetchUrls = ({ slug }) => [query(slug)];
