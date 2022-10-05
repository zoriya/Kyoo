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
import { WatchItem, WatchItemP, Chapter, Track } from "~/models/resources/watch-item";
import { useFetch } from "~/utils/query";
import { ErrorPage } from "~/components/errors";
import {
	useState,
	useRef,
	useEffect,
	memo,
	useMemo,
	useCallback,
	RefObject,
} from "react";
import {
	Box,
	CircularProgress,
	IconButton,
	Tooltip,
	Typography,
	Skeleton,
	Slider,
	Menu,
	MenuItem,
	ListItemText,
    BoxProps,
} from "@mui/material";
import useTranslation from "next-translate/useTranslation";
import {
	ArrowBack,
	ClosedCaption,
	Fullscreen,
	FullscreenExit,
	Pause,
	PlayArrow,
	SkipNext,
	SkipPrevious,
	VolumeDown,
	VolumeMute,
	VolumeOff,
	VolumeUp,
} from "@mui/icons-material";
import { Poster } from "~/components/poster";
import { episodeDisplayNumber } from "~/components/episode";
import { Link } from "~/utils/link";
import NextLink from "next/link";
import { useRouter } from "next/router";
// @ts-ignore
import SubtitleOctopus from "@jellyfin/libass-wasm"

const toTimerString = (timer: number, duration?: number) => {
	if (!duration) duration = timer;
	if (duration >= 3600) return new Date(timer * 1000).toISOString().substring(11, 19);
	return new Date(timer * 1000).toISOString().substring(14, 19);
};

const SubtitleMenu = ({
	subtitles,
	setSubtitle,
	selectedID,
	anchor,
	onClose,
}: {
	subtitles: Track[];
	setSubtitle: (subtitle: Track | null) => void;
	selectedID?: number;
	anchor: HTMLElement;
	onClose: () => void;
}) => {
	const router = useRouter();
	const { t } = useTranslation("player");
	const { subtitle, ...queryWithoutSubs } = router.query;

	return (
		<Menu
			id="subtitle-menu"
			MenuListProps={{
				"aria-labelledby": "subtitle",
			}}
			anchorEl={anchor}
			open={!!anchor}
			onClose={onClose}
			anchorOrigin={{
				vertical: "top",
				horizontal: "center",
			}}
			transformOrigin={{
				vertical: "bottom",
				horizontal: "center",
			}}
		>
			<MenuItem
				selected={!selectedID}
				onClick={() => {
					setSubtitle(null);
					onClose();
				}}
				component={Link}
				to={{ query: queryWithoutSubs }}
				shallow
				replace
			>
				<ListItemText>{t("subtitle-none")}</ListItemText>
			</MenuItem>
			{subtitles.map((sub) => (
				<MenuItem
					key={sub.id}
					selected={selectedID == sub.id}
					onClick={() => {
						setSubtitle(sub);
						onClose();
					}}
					component={Link}
					to={{ query: { ...router.query, subtitle: sub.language ?? sub.id } }}
					shallow
					replace
				>
					<ListItemText>{sub.displayName}</ListItemText>
				</MenuItem>
			))}
		</Menu>
	);
};

const LoadingIndicator = () => {
	return (
		<Box
			sx={{
				position: "absolute",
				top: 0,
				bottom: 0,
				left: 0,
				right: 0,
				background: "rgba(0, 0, 0, 0.3)",
				display: "flex",
				justifyContent: "center",
			}}
		>
			<CircularProgress thickness={5} sx={{ color: "white", alignSelf: "center" }} />
		</Box>
	);
};

const ProgressBar = ({
	progress,
	duration,
	buffered,
	chapters,
	setProgress,
}: {
	progress: number;
	duration: number;
	buffered: number;
	chapters?: Chapter[];
	setProgress: (value: number) => void;
}) => {
	const [isSeeking, setSeek] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	const updateProgress = (event: MouseEvent, skipSeek?: boolean) => {
		if (!(isSeeking || skipSeek) || !ref?.current) return;
		const value: number = (event.pageX - ref.current.offsetLeft) / ref.current.clientWidth;
		setProgress(Math.max(0, Math.min(value, 1)) * duration);
	};

	useEffect(() => {
		const handler = () => setSeek(false);

		document.addEventListener("mouseup", handler);
		return () => document.removeEventListener("mouseup", handler);
	});
	useEffect(() => {
		document.addEventListener("mousemove", updateProgress);
		return () => document.removeEventListener("mousemove", updateProgress);
	});

	return (
		<Box
			onMouseDown={(event) => {
				event.preventDefault();
				setSeek(true);
			}}
			onTouchStart={() => setSeek(true)}
			onClick={(event) => updateProgress(event.nativeEvent, true)}
			sx={{
				width: "100%",
				py: 1,
				cursor: "pointer",
				"&:hover": {
					".thumb": { opacity: 1 },
					".bar": { transform: "unset" },
				},
			}}
		>
			<Box
				ref={ref}
				className="bar"
				sx={{
					width: "100%",
					height: "4px",
					background: "rgba(255, 255, 255, 0.2)",
					transform: isSeeking ? "unset" : "scaleY(.6)",
					position: "relative",
				}}
			>
				<Box
					sx={{
						width: `${(buffered / duration) * 100}%`,
						position: "absolute",
						top: 0,
						bottom: 0,
						left: 0,
						background: "rgba(255, 255, 255, 0.5)",
					}}
				/>
				<Box
					sx={{
						width: `${(progress / duration) * 100}%`,
						position: "absolute",
						top: 0,
						bottom: 0,
						left: 0,
						background: (theme) => theme.palette.primary.main,
					}}
				/>
				<Box
					className="thumb"
					sx={{
						position: "absolute",
						left: `calc(${(progress / duration) * 100}% - 6px)`,
						top: 0,
						bottom: 0,
						margin: "auto",
						opacity: +isSeeking,
						width: "12px",
						height: "12px",
						borderRadius: "6px",
						background: (theme) => theme.palette.primary.main,
					}}
				/>

				{chapters?.map((x) => (
					<Box
						key={x.startTime}
						sx={{
							position: "absolute",
							width: "2px",
							top: 0,
							botton: 0,
							left: `${(x.startTime / duration) * 100}%`,
							background: (theme) => theme.palette.primary.dark,
						}}
					/>
				))}
			</Box>
		</Box>
	);
};

const VideoPoster = memo(function VideoPoster({ poster }: { poster?: string | null }) {
	return (
		<Box
			sx={{
				width: "15%",
				display: { xs: "none", sm: "block" },
				position: "relative",
			}}
		>
			<Poster img={poster} width="100%" sx={{ position: "absolute", bottom: 0 }} />
		</Box>
	);
});

const LeftButtons = memo(function LeftButtons({
	previousSlug,
	nextSlug,
	isPlaying,
	isMuted,
	volume,
	togglePlay,
	toggleMute,
	setVolume,
}: {
	previousSlug?: string;
	nextSlug?: string;
	isPlaying: boolean;
	isMuted: boolean;
	volume: number;
	togglePlay: () => void;
	toggleMute: () => void;
	setVolume: (value: number) => void;
}) {
	const { t } = useTranslation("player");

	return (
		<Box sx={{ display: "flex", "> *": { mx: "8px !important" } }}>
			{previousSlug && (
				<Tooltip title={t("previous")}>
					<NextLink href={`/watch/${previousSlug}`} passHref>
						<IconButton aria-label={t("previous")} sx={{ color: "white" }}>
							<SkipPrevious />
						</IconButton>
					</NextLink>
				</Tooltip>
			)}
			<Tooltip title={isPlaying ? t("pause") : t("play")}>
				<IconButton
					onClick={togglePlay}
					aria-label={isPlaying ? t("pause") : t("play")}
					sx={{ color: "white" }}
				>
					{isPlaying ? <Pause /> : <PlayArrow />}
				</IconButton>
			</Tooltip>
			{nextSlug && (
				<Tooltip title={t("next")}>
					<NextLink href={`/watch/${nextSlug}`} passHref>
						<IconButton aria-label={t("next")} sx={{ color: "white" }}>
							<SkipNext />
						</IconButton>
					</NextLink>
				</Tooltip>
			)}
			<Box
				sx={{
					display: "flex",
					m: "0 !important",
					p: "8px",
					"&:hover .slider": { width: "100px", px: "16px" },
				}}
			>
				<Tooltip title={t("mute")}>
					<IconButton onClick={toggleMute} aria-label={t("mute")} sx={{ color: "white" }}>
						{isMuted || volume == 0 ? (
							<VolumeOff />
						) : volume < 25 ? (
							<VolumeMute />
						) : volume < 65 ? (
							<VolumeDown />
						) : (
							<VolumeUp />
						)}
					</IconButton>
				</Tooltip>
				<Box
					className="slider"
					sx={{
						width: 0,
						transition:
							"width .2s cubic-bezier(0.4,0, 1, 1), padding .2s cubic-bezier(0.4,0, 1, 1)",
						overflow: "hidden",
						alignSelf: "center",
					}}
				>
					<Slider
						value={volume}
						onChange={(_, value) => setVolume(value as number)}
						size="small"
						aria-label={t("volume")}
						sx={{ alignSelf: "center" }}
					/>
				</Box>
			</Box>
		</Box>
	);
});

const RightButtons = memo(function RightButton({
	isFullscreen,
	toggleFullscreen,
	subtitles,
	selectedSubtitle,
	selectSubtitle,
}: {
	isFullscreen: boolean;
	toggleFullscreen: () => void;
	subtitles?: Track[];
	selectedSubtitle: Track | null;
	selectSubtitle: (track: Track | null) => void;
}) {
	const { t } = useTranslation("player");
	const [subtitleAnchor, setSubtitleAnchor] = useState<HTMLButtonElement | null>(null);

	return (
		<Box sx={{ "> *": { m: "8px !important" } }}>
			{subtitles && (
				<Tooltip title={t("subtitles")}>
					<IconButton
						id="sortby"
						aria-label={t("subtitles")}
						aria-controls={subtitleAnchor ? "subtitle-menu" : undefined}
						aria-haspopup="true"
						aria-expanded={subtitleAnchor ? "true" : undefined}
						onClick={(event) => setSubtitleAnchor(event.currentTarget)}
						sx={{ color: "white" }}
					>
						<ClosedCaption />
					</IconButton>
				</Tooltip>
			)}
			<Tooltip title={t("fullscreen")}>
				<IconButton onClick={toggleFullscreen} aria-label={t("fullscreen")} sx={{ color: "white" }}>
					{isFullscreen ? <FullscreenExit /> : <Fullscreen />}
				</IconButton>
			</Tooltip>
			{subtitleAnchor && (
				<SubtitleMenu
					subtitles={subtitles!}
					anchor={subtitleAnchor}
					setSubtitle={selectSubtitle}
					selectedID={selectedSubtitle?.id}
					onClose={() => setSubtitleAnchor(null)}
				/>
			)}
		</Box>
	);
});

const Back = memo(function Back({ name, href }: { name?: string; href: string }) {
	const { t } = useTranslation("player");

	return (
		<Box
			sx={{
				position: "absolute",
				top: 0,
				left: 0,
				right: 0,
				background: "rgba(0, 0, 0, 0.6)",
				display: "flex",
				p: "0.33%",
				color: "white",
			}}
		>
			<Tooltip title={t("back")}>
				<NextLink href={href} passHref>
					<IconButton aria-label={t("back")} sx={{ color: "white" }}>
						<ArrowBack />
					</IconButton>
				</NextLink>
			</Tooltip>
			<Typography component="h1" variant="h5" sx={{ alignSelf: "center", ml: "1rem" }}>
				{name ? name : <Skeleton />}
			</Typography>
		</Box>
	);
});

const useSubtitleController = (player: RefObject<HTMLVideoElement>): [Track | null, (value: Track | null) => void] => {
	const [selectedSubtitle, setSubtitle] = useState<Track | null>(null);
	const [htmlTrack, setHtmlTrack] = useState<HTMLTrackElement | null>(null);
	const [subocto, setSubOcto] = useState<SubtitleOctopus | null>(null);

	return [
		selectedSubtitle,
		useCallback(
			(value: Track | null) => {
				const removeHtmlSubtitle = () => {
					if (htmlTrack) htmlTrack.remove();
					setHtmlTrack(null);
				};
				const removeOctoSub = () => {
					if (subocto) {
						subocto.freeTrack();
						subocto.dispose();
					}
					setSubOcto(null);
				};

				if (!player.current) return;

				setSubtitle(value);
				if (!value) {
					removeHtmlSubtitle();
					removeOctoSub();
				} else if (value.codec === "vtt" || value.codec === "srt") {
					removeOctoSub();
					const track: HTMLTrackElement = htmlTrack ?? document.createElement("track");
					track.kind = "subtitles";
					track.label = value.displayName;
					if (value.language) track.srclang = value.language;
					track.src = `subtitle/${value.slug}.vtt`;
					track.className = "subtitle_container";
					track.default = true;
					track.onload = () => {
						if (player.current) player.current.textTracks[0].mode = "showing";
					};
					player.current.appendChild(track);
					setHtmlTrack(track);
				} else if (value.codec === "ass") {
					removeHtmlSubtitle();
					removeOctoSub();
					setSubOcto(
						new SubtitleOctopus({
							video: player.current,
							subUrl: `/api/subtitle/${value.slug}`,
							workerUrl: "/_next/static/chunks/subtitles-octopus-worker.js",
							legacyWorkerUrl: "/_next/static/chunks/subtitles-octopus-worker-legacy.js",
							/* fonts:  */
							renderMode: "wasm-blend",
						}),
					);
				}
			},
			[htmlTrack, subocto, player],
		),
	];
};

const useVideoController = () => {
	const player = useRef<HTMLVideoElement>(null);
	const [isPlaying, setPlay] = useState(true);
	const [isLoading, setLoad] = useState(false);
	const [progress, setProgress] = useState(0);
	const [duration, setDuration] = useState(0);
	const [buffered, setBuffered] = useState(0);
	const [volume, setVolume] = useState(100);
	const [isMuted, setMute] = useState(false);
	const [isFullscreen, setFullscreen] = useState(false);
	const [selectedSubtitle, selectSubtitle] = useSubtitleController(player);

	useEffect(() => {
		if (!player?.current?.duration) return;
		setDuration(player.current.duration);
	}, [player]);

	const togglePlay = useCallback(() => {
		if (!player.current) return;
		if (!isPlaying) {
			player.current.play();
		} else {
			player.current.pause();
		}
	}, [isPlaying, player]);

	const toggleFullscreen = useCallback(() => {
		setFullscreen(!isFullscreen);
		if (isFullscreen) {
			document.exitFullscreen();
		} else {
			document.body.requestFullscreen();
		}
	}, [isFullscreen]);

	const videoProps: BoxProps<"video"> = useMemo(
		() => ({
			ref: player,
			onClick: togglePlay,
			onDoubleClick: () => toggleFullscreen,
			onPlay: () => setPlay(true),
			onPause: () => setPlay(false),
			onWaiting: () => setLoad(true),
			onCanPlay: () => setLoad(false),
			onTimeUpdate: () => setProgress(player?.current?.currentTime ?? 0),
			onDurationChange: () => setDuration(player?.current?.duration ?? 0),
			onProgress: () =>
				setBuffered(
					player?.current?.buffered.length
						? player.current.buffered.end(player.current.buffered.length - 1)
						: 0,
				),
			onVolumeChange: () => {
				if (!player.current) return;
				setVolume(player.current.volume * 100);
				setMute(player?.current.muted);
			},
			autoPlay: true,
			controls: false,
		}),
		[player, togglePlay, toggleFullscreen],
	);
	return {
		state: {
			isPlaying,
			isLoading,
			progress,
			duration,
			buffered,
			volume,
			isMuted,
			isFullscreen,
			selectedSubtitle,
		},
		videoProps,
		togglePlay,
		toggleMute: useCallback(() => {
			if (player.current) player.current.muted = !isMuted;
		}, [player, isMuted]),
		toggleFullscreen,
		setVolume: useCallback(
			(value: number) => {
				setVolume(value);
				if (player.current) player.current.volume = value / 100;
			},
			[player],
		),
		setProgress: useCallback(
			(value: number) => {
				setProgress(value);
				if (player.current) player.current.currentTime = value;
			},
			[player],
		),
		selectSubtitle,
	};
};

const query = (slug: string): QueryIdentifier<WatchItem> => ({
	path: ["watch", slug],
	parser: WatchItemP,
});

// Callback used to hide the controls when the mouse goes iddle. This is stored globally to clear the old timeout
// if the mouse moves again
let mouseCallback: NodeJS.Timeout;

const Player: QueryPage<{ slug: string }> = ({ slug }) => {
	const { data, error } = useFetch(query(slug));
	const {
		state: {
			isPlaying,
			isLoading,
			progress,
			duration,
			buffered,
			volume,
			isMuted,
			isFullscreen,
			selectedSubtitle,
		},
		videoProps,
		togglePlay,
		toggleMute,
		toggleFullscreen,
		setProgress,
		setVolume,
		selectSubtitle,
	} = useVideoController();
	const [showHover, setHover] = useState(false);
	const [mouseMoved, setMouseMoved] = useState(false);

	useEffect(() => {
		const handler = () => {
			setMouseMoved(true);
			if (mouseCallback) clearTimeout(mouseCallback);
			mouseCallback = setTimeout(() => {
				setMouseMoved(false);
			}, 2500);
		};

		document.addEventListener("mousemove", handler);
		return () => document.removeEventListener("mousemove", handler);
	});

	const name = data
		? data.isMovie
			? data.name
			: `${episodeDisplayNumber(data, "")} ${data.name}`
		: undefined;
	const displayControls = showHover || !isPlaying || mouseMoved;

	if (error) return <ErrorPage {...error} />;

	return (
		<Box
			onMouseLeave={() => setMouseMoved(false)}
			sx={{ cursor: displayControls ? "unset" : "none" }}
		>
			<Box
				component="video"
				src={data?.link.direct}
				{...videoProps}
				sx={{
					position: "absolute",
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
			{isLoading && <LoadingIndicator />}
			<Box
				onMouseEnter={() => setHover(true)}
				onMouseLeave={() => setHover(false)}
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
			>
				<Back
					name={data?.name}
					href={data ? (data.isMovie ? `/movie/${data.slug}` : `/show/${data.showSlug}`) : "#"}
				/>
				<Box
					sx={{
						position: "absolute",
						bottom: 0,
						left: 0,
						right: 0,
						background: "rgba(0, 0, 0, 0.6)",
						display: "flex",
						padding: "1%",
					}}
				>
					<VideoPoster poster={data?.poster} />
					<Box sx={{ width: "100%", ml: 3, display: "flex", flexDirection: "column" }}>
						<Typography variant="h4" component="h2" color="white" sx={{ pb: 1 }}>
							{name ?? <Skeleton />}
						</Typography>

						<ProgressBar
							progress={progress}
							duration={duration}
							buffered={buffered}
							setProgress={setProgress}
							chapters={data?.chapters}
						/>

						<Box sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between" }}>
							<Box sx={{ display: "flex" }}>
								<LeftButtons
									previousSlug={data && !data.isMovie ? data.previousEpisode?.slug : undefined}
									nextSlug={data && !data.isMovie ? data.nextEpisode?.slug : undefined}
									isPlaying={isPlaying}
									volume={volume}
									isMuted={isMuted}
									togglePlay={togglePlay}
									toggleMute={toggleMute}
									setVolume={setVolume}
								/>
								<Typography color="white" sx={{ alignSelf: "center" }}>
									{toTimerString(progress, duration)} : {toTimerString(duration)}
								</Typography>
							</Box>
							<RightButtons
								isFullscreen={isFullscreen}
								toggleFullscreen={toggleFullscreen}
								subtitles={data?.subtitles}
								selectedSubtitle={selectedSubtitle}
								selectSubtitle={selectSubtitle}
							/>
						</Box>
					</Box>
				</Box>
			</Box>
		</Box>
	);
};

Player.getFetchUrls = ({ slug }) => [query(slug)];

export default withRoute(Player);
