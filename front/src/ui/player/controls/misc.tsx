import FullscreenExit from "@material-symbols/svg-400/rounded/fullscreen_exit-fill.svg";
import Fullscreen from "@material-symbols/svg-400/rounded/fullscreen-fill.svg";
import Pause from "@material-symbols/svg-400/rounded/pause-fill.svg";
import PlayArrow from "@material-symbols/svg-400/rounded/play_arrow-fill.svg";
import VolumeDown from "@material-symbols/svg-400/rounded/volume_down-fill.svg";
import VolumeMute from "@material-symbols/svg-400/rounded/volume_mute-fill.svg";
import VolumeOff from "@material-symbols/svg-400/rounded/volume_off-fill.svg";
import VolumeUp from "@material-symbols/svg-400/rounded/volume_up-fill.svg";
import { type ComponentProps, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { type PressableProps, View } from "react-native";
import { useEvent, type VideoPlayer } from "react-native-video";
import { px, useYoshiki } from "yoshiki/native";
import {
	alpha,
	CircularProgress,
	IconButton,
	Slider,
	tooltip,
	ts,
} from "~/primitives";

export const PlayButton = ({
	player,
	...props
}: { player: VideoPlayer } & Partial<
	ComponentProps<typeof IconButton<PressableProps>>
>) => {
	const { t } = useTranslation();

	const [playing, setPlay] = useState(player.isPlaying);
	useEvent(player, "onPlaybackStateChange", (status) => {
		setPlay(status.isPlaying);
	});

	return (
		<IconButton
			icon={playing ? Pause : PlayArrow}
			onPress={() => {
				if (playing) player.pause();
				else player.play();
			}}
			{...tooltip(playing ? t("player.pause") : t("player.play"), true)}
			{...props}
		/>
	);
};

export const toggleFullscreen = async (set?: boolean) => {
	set ??= document.fullscreenElement === null;
	try {
		if (set) {
			await document.body.requestFullscreen({ navigationUI: "hide" });
			// @ts-expect-error Firefox does not support this so ts complains
			await screen.orientation.lock("landscape");
		} else {
			if (document.fullscreenElement) await document.exitFullscreen();
			screen.orientation.unlock();
		}
	} catch (e) {
		console.log(e);
	}
};

export const FullscreenButton = (
	props: Partial<ComponentProps<typeof IconButton<PressableProps>>>,
) => {
	// this is a web only component
	const { t } = useTranslation();

	const [fullscreen, setFullscreen] = useState(false);
	useEffect(() => {
		const update = () => setFullscreen(document.fullscreenElement !== null);
		document.addEventListener("fullscreenchange", update);
		return () => document.removeEventListener("fullscreenchange", update);
	}, []);

	return (
		<IconButton
			icon={fullscreen ? FullscreenExit : Fullscreen}
			onPress={() => toggleFullscreen()}
			{...tooltip(t("player.fullscreen"), true)}
			{...props}
		/>
	);
};

export const VolumeSlider = ({ player, ...props }: { player: VideoPlayer }) => {
	const { css } = useYoshiki();
	const { t } = useTranslation();

	const [volume, setVolume] = useState(player.volume);
	const [muted, setMuted] = useState(player.muted);
	useEvent(player, "onVolumeChange", (info) => {
		setVolume(info.volume);
		setMuted(info.muted);
	});

	return (
		<View
			{...css(
				{
					display: { xs: "none", sm: "flex" },
					alignItems: "center",
					flexDirection: "row",
					paddingRight: ts(1),
				},
				props,
			)}
		>
			<IconButton
				icon={
					muted || volume === 0
						? VolumeOff
						: volume < 0.25
							? VolumeMute
							: volume < 0.65
								? VolumeDown
								: VolumeUp
				}
				onPress={() => {
					player.muted = !muted;
				}}
				{...tooltip(t("player.mute"), true)}
			/>
			<Slider
				progress={volume * 100}
				setProgress={(vol) => {
					player.volume = vol / 100;
				}}
				size={4}
				{...css({ width: px(100) })}
				{...tooltip(t("player.volume"), true)}
			/>
		</View>
	);
};

export const LoadingIndicator = ({ player }: { player: VideoPlayer }) => {
	const { css } = useYoshiki();
	const [isLoading, setLoading] = useState(false);

	useEvent(player, "onStatusChange", (status) => {
		setLoading(status === "loading");
	});

	if (!isLoading) return null;

	return (
		<View
			{...css({
				position: "absolute",
				pointerEvents: "none",
				top: 0,
				bottom: 0,
				left: 0,
				right: 0,
				bg: (theme) => alpha(theme.colors.black, 0.3),
				justifyContent: "center",
			})}
		>
			<CircularProgress {...css({ alignSelf: "center" })} />
		</View>
	);
};
