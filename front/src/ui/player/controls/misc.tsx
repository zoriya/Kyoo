import FullscreenExit from "@material-symbols/svg-400/rounded/fullscreen_exit-fill.svg";
import Fullscreen from "@material-symbols/svg-400/rounded/fullscreen-fill.svg";
import Pause from "@material-symbols/svg-400/rounded/pause-fill.svg";
import PlayArrow from "@material-symbols/svg-400/rounded/play_arrow-fill.svg";
import VolumeDown from "@material-symbols/svg-400/rounded/volume_down-fill.svg";
import VolumeMute from "@material-symbols/svg-400/rounded/volume_mute-fill.svg";
import VolumeOff from "@material-symbols/svg-400/rounded/volume_off-fill.svg";
import VolumeUp from "@material-symbols/svg-400/rounded/volume_up-fill.svg";
import { type ComponentProps, useState } from "react";
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

export const FullscreenButton = (
	props: Partial<ComponentProps<typeof IconButton<PressableProps>>>,
) => {
	const { t } = useTranslation();

	// TODO: actually implement that
	const [fullscreen, setFullscreen] = useState(true);

	return (
		<IconButton
			icon={fullscreen ? FullscreenExit : Fullscreen}
			onPress={() => console.log("lol")}
			{...tooltip(t("player.fullscreen"), true)}
			{...props}
		/>
	);
};

export const VolumeSlider = ({ player, ...props }: { player: VideoPlayer }) => {
	const { css } = useYoshiki();
	const { t } = useTranslation();

	const [volume, setVolume] = useState(player.volume);
	useEvent(player, "onVolumeChange", setVolume);
	// TODO: listen to `player.muted` changes (currently hook does not exists
	// const [muted, setMuted] = useState(player.muted);
	const muted = player.muted;

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
						: volume < 25
							? VolumeMute
							: volume < 65
								? VolumeDown
								: VolumeUp
				}
				onPress={() => {
					player.muted = !muted;
				}}
				{...tooltip(t("player.mute"), true)}
			/>
			<Slider
				progress={volume}
				setProgress={(vol) => {
					player.volume = vol;
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
