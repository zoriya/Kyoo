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

import { QueryIdentifier, QueryPage } from "~/utils/query";
import { withRoute } from "~/utils/router";
import { WatchItem, WatchItemP } from "~/models/resources/watch-item";
import { useFetch } from "~/utils/query";
import { ErrorPage } from "~/components/errors";
import { useState, useEffect, PointerEvent as ReactPointerEvent } from "react";
import { Box, styled } from "@mui/material";
import { useAtom, useSetAtom } from "jotai";
import { Hover, LoadingIndicator } from "./components/hover";
import {
	fullscreenAtom,
	playAtom,
	stopAtom,
	useSubtitleController,
	useVideoController,
} from "./state";
import { useRouter } from "next/router";
import Head from "next/head";
import { makeTitle } from "~/utils/utils";
import { episodeDisplayNumber } from "~/components/episode";
import { useVideoKeyboard } from "./keyboard";
import { MediaSessionManager } from "./media-session";

const Video = styled("video")({});

// Callback used to hide the controls when the mouse goes iddle. This is stored globally to clear the old timeout
// if the mouse moves again (if this is stored as a state, the whole page is redrawn on mouse move)
let mouseCallback: NodeJS.Timeout;

const query = (slug: string): QueryIdentifier<WatchItem> => ({
	path: ["watch", slug],
	// @ts-ignore
	parser: WatchItemP,
});

const Player: QueryPage<{ slug: string }> = ({ slug }) => {
	const { data, error } = useFetch(query(slug));
	const { playerRef, videoProps, onVideoClick } = useVideoController(slug, data?.link);
	const setFullscreen = useSetAtom(fullscreenAtom);
	const setStopCallback = useSetAtom(stopAtom);
	const router = useRouter();

	const [isPlaying, setPlay] = useAtom(playAtom);
	const [showHover, setHover] = useState(false);
	const [mouseMoved, setMouseMoved] = useState(false);
	const [menuOpenned, setMenuOpen] = useState(false);
	const displayControls = showHover || !isPlaying || mouseMoved || menuOpenned;

	const previous =
		data && !data.isMovie && data.previousEpisode
			? `/watch/${data.previousEpisode.slug}`
			: undefined;
	const next =
		data && !data.isMovie && data.nextEpisode ? `/watch/${data.nextEpisode.slug}` : undefined;

	const mouseHasMoved = () => {
		setMouseMoved(true);
		if (mouseCallback) clearTimeout(mouseCallback);
		mouseCallback = setTimeout(() => {
			setMouseMoved(false);
		}, 2500);
	};

	useEffect(() => {
		const handler = (e: PointerEvent) => {
			if (e.pointerType !== "mouse") return;
			mouseHasMoved();
		};

		document.addEventListener("pointermove", handler);
		return () => document.removeEventListener("pointermove", handler);
	});

	useEffect(() => {
		setPlay(true);
	}, [slug, setPlay]);

	useEffect(() => {
		if (!/Mobi/i.test(window.navigator.userAgent)) return;
		setFullscreen(true);
		return () => setFullscreen(false);
	}, [setFullscreen]);

	useSubtitleController(playerRef, data?.subtitles, data?.fonts);
	useVideoKeyboard(data?.subtitles, data?.fonts, previous, next);

	useEffect(() => {
		setStopCallback([ () => {
			router.push(data ? (data.isMovie ? `/movie/${data.slug}` : `/show/${data.showSlug}`) : "/");
		}]);
		return () => {
			setStopCallback([() => {}]);
		};
	}, [setStopCallback, data, router]);

	if (error) return <ErrorPage {...error} />;

	return (
		<>
			{data && (
				<Head>
					<title>
						{makeTitle(
							data.isMovie
								? data.name
								: data.showTitle +
										" " +
										episodeDisplayNumber({
											seasonNumber: data.seasonNumber,
											episodeNumber: data.episodeNumber,
											absoluteNumber: data.absoluteNumber,
										}),
						)}
					</title>
					<meta name="description" content={data.overview ?? undefined} />
				</Head>
			)}
			<MediaSessionManager
				title={data?.name}
				image={data?.thumbnail}
				next={next}
				previous={previous}
			/>
			<style jsx global>{`
				::cue {
					background-color: transparent;
					text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
				}
			`}</style>
			<Box
				onMouseLeave={() => setMouseMoved(false)}
				sx={{ cursor: displayControls ? "unset" : "none" }}
			>
				<Video
					{...videoProps}
					onPointerDown={(e: ReactPointerEvent<HTMLVideoElement>) => {
						if (e.pointerType === "mouse") {
							onVideoClick();
						} else if (mouseMoved) {
							setMouseMoved(false);
						} else {
							mouseHasMoved();
						}
					}}
					onEnded={() => {
						if (!data) return;
						if (data.isMovie) router.push(`/movie/${data.slug}`);
						else
							router.push(
								data.nextEpisode ? `/watch/${data.nextEpisode.slug}` : `/show/${data.showSlug}`,
							);
					}}
					sx={{
						position: "fixed",
						top: 0,
						bottom: 0,
						left: 0,
						right: 0,
						width: "100%",
						height: "100%",
						objectFit: "contain",
						background: "black",
					}}
				/>
				<LoadingIndicator />
				<Hover
					data={data}
					onPointerOver={(e: ReactPointerEvent<HTMLElement>) => {
						if (e.pointerType === "mouse") setHover(true);
					}}
					onPointerOut={() => setHover(false)}
					onMenuOpen={() => setMenuOpen(true)}
					onMenuClose={() => {
						// Disable hover since the menu overlay makes the mouseout unreliable.
						setHover(false);
						setMenuOpen(false);
					}}
					sx={
						displayControls
							? {
									visibility: "visible",
									opacity: 1,
									transition: "opacity .2s ease-in",
							  }
							: {
									visibility: "hidden",
									opacity: 0,
									transition: "opacity .4s ease-out, visibility 0s .4s",
							  }
					}
				/>
			</Box>
		</>
	);
};

Player.getFetchUrls = ({ slug }) => [query(slug)];

export default withRoute(Player);
