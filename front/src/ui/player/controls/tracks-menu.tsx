import ClosedCaption from "@material-symbols/svg-400/rounded/closed_caption-fill.svg";
import MusicNote from "@material-symbols/svg-400/rounded/music_note-fill.svg";
import SettingsIcon from "@material-symbols/svg-400/rounded/settings-fill.svg";
import VideoSettings from "@material-symbols/svg-400/rounded/video_settings-fill.svg";
import { type ComponentProps, createContext, useContext } from "react";
import { useEvent, type VideoPlayer } from "react-native-video";
import { useTranslation } from "react-i18next";
import { IconButton, Menu, tooltip } from "~/primitives";
import { useDisplayName } from "~/track-utils";
import { useForceRerender } from "yoshiki";

type MenuProps = ComponentProps<typeof Menu<ComponentProps<typeof IconButton>>>;

export const SubtitleMenu = (props: Partial<MenuProps>) => {
	const { t } = useTranslation();

	// {subtitles && subtitles.length > 0 && (
	// )}
	return (
		<Menu
			Trigger={IconButton}
			icon={ClosedCaption}
			{...tooltip(t("player.subtitles"), true)}
			{...props}
		>
			{/* <Menu.Item */}
			{/* 	label={t("player.subtitle-none")} */}
			{/* 	selected={!selectedSubtitle} */}
			{/* 	onSelect={() => setSubtitle(null)} */}
			{/* /> */}
			{/* {subtitles */}
			{/* 	.filter((x) => !!x.link) */}
			{/* 	.map((x, i) => ( */}
			{/* 		<Menu.Item */}
			{/* 			key={x.index ?? i} */}
			{/* 			label={ */}
			{/* 				x.link ? getSubtitleName(x) : `${getSubtitleName(x)} (${x.codec})` */}
			{/* 			} */}
			{/* 			selected={selectedSubtitle === x} */}
			{/* 			disabled={!x.link} */}
			{/* 			onSelect={() => setSubtitle(x)} */}
			{/* 		/> */}
			{/* 	))} */}
		</Menu>
	);
};

export const AudioMenu = ({
	player,
	...props
}: { player: VideoPlayer } & Partial<MenuProps>) => {
	const { t } = useTranslation();
	const getDisplayName = useDisplayName();
	const rerender = useForceRerender();

	useEvent(player, "onAudioTrackChange", rerender);

	const tracks = player.getAvailableAudioTracks();

	if (tracks.length === 0) return null;

	return (
		<Menu
			Trigger={IconButton}
			icon={MusicNote}
			{...tooltip(t("player.audios"), true)}
			{...props}
		>
			{tracks.map((x) => (
				<Menu.Item
					key={x.id}
					label={getDisplayName({ title: x.label, language: x.language })}
					selected={x.selected}
					onSelect={() => player.selectAudioTrack(x)}
				/>
			))}
		</Menu>
	);
};

export const VideoMenu = (props: Partial<MenuProps>) => {
	const { t } = useTranslation();

	return (
		<Menu
			Trigger={IconButton}
			icon={VideoSettings}
			{...tooltip(t("player.audios"), true)}
			{...props}
		></Menu>
	);
};

export const PlayModeContext = createContext<
	["direct" | "hls", (val: "direct" | "hls") => void]
>(null!);

export const QualityMenu = (props: Partial<MenuProps>) => {
	const { t } = useTranslation();
	const [playMode, setPlayMode] = useContext(PlayModeContext);

	return (
		<Menu
			Trigger={IconButton}
			icon={SettingsIcon}
			{...tooltip(t("player.quality"), true)}
			{...props}
		>
			<Menu.Item
				label={t("player.direct")}
				selected={playMode === "direct"}
				onSelect={() => setPlayMode("direct")}
			/>
			{/* <Menu.Item */}
			{/* 	label={ */}
			{/* 		hls?.autoLevelEnabled && hls.currentLevel >= 0 */}
			{/* 			? `${t("player.auto")} (${levelName(hls.levels[hls.currentLevel], true)})` */}
			{/* 			: t("player.auto") */}
			{/* 	} */}
			{/* 	selected={hls?.autoLevelEnabled && mode === PlayMode.Hls} */}
			{/* 	onSelect={() => { */}
			{/* 		setPlayMode(PlayMode.Hls); */}
			{/* 		if (hls) hls.currentLevel = -1; */}
			{/* 	}} */}
			{/* /> */}
			{/* {hls?.levels */}
			{/* 	.map((x, i) => ( */}
			{/* 		<Menu.Item */}
			{/* 			key={i.toString()} */}
			{/* 			label={levelName(x)} */}
			{/* 			selected={ */}
			{/* 				mode === PlayMode.Hls && */}
			{/* 				hls!.currentLevel === i && */}
			{/* 				!hls?.autoLevelEnabled */}
			{/* 			} */}
			{/* 			onSelect={() => { */}
			{/* 				setPlayMode(PlayMode.Hls); */}
			{/* 				hls!.currentLevel = i; */}
			{/* 			}} */}
			{/* 		/> */}
			{/* 	)) */}
			{/* 	.reverse()} */}
		</Menu>
	);
};
