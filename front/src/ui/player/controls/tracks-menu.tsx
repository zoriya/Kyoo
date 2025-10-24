import ClosedCaption from "@material-symbols/svg-400/rounded/closed_caption-fill.svg";
import MusicNote from "@material-symbols/svg-400/rounded/music_note-fill.svg";
import SettingsIcon from "@material-symbols/svg-400/rounded/settings-fill.svg";
import VideoSettings from "@material-symbols/svg-400/rounded/video_settings-fill.svg";
import { type ComponentProps, createContext, useContext } from "react";
import { useTranslation } from "react-i18next";
import { useEvent, type VideoPlayer } from "react-native-video";
import { useForceRerender } from "yoshiki";
import { IconButton, Menu, tooltip } from "~/primitives";
import { useFetch } from "~/query";
import { useDisplayName, useSubtitleName } from "~/track-utils";
import { Info } from "~/ui/info";
import { useQueryState } from "~/utils";

type MenuProps = ComponentProps<typeof Menu<ComponentProps<typeof IconButton>>>;

export const SubtitleMenu = ({
	player,
	...props
}: {
	player: VideoPlayer;
} & Partial<MenuProps>) => {
	const { t } = useTranslation();
	const getDisplayName = useSubtitleName();

	const rerender = useForceRerender();
	useEvent(player, "onTrackChange", rerender);

	const [slug] = useQueryState<string>("slug", undefined!);
	const { data } = useFetch(Info.infoQuery(slug));

	if (data?.subtitles.length === 0) return null;

	const selectedIdx = player
		.getAvailableTextTracks()
		.findIndex((x) => x.selected);

	return (
		<Menu
			Trigger={IconButton}
			icon={ClosedCaption}
			{...tooltip(t("player.subtitles"), true)}
			{...props}
		>
			<Menu.Item
				label={t("player.subtitle-none")}
				selected={selectedIdx === -1}
				onSelect={() => player.selectTextTrack(null)}
			/>
			{data?.subtitles.map((x, i) => (
				<Menu.Item
					key={x.index ?? x.link}
					label={getDisplayName(x)}
					selected={i === selectedIdx}
					onSelect={() =>
						player.selectTextTrack(player.getAvailableTextTracks()[i])
					}
				/>
			))}
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
	if (tracks.length <= 1) return null;

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

export const VideoMenu = ({
	player,
	...props
}: {
	player: VideoPlayer;
} & Partial<MenuProps>) => {
	const { t } = useTranslation();
	const getDisplayName = useDisplayName();

	const rerender = useForceRerender();
	useEvent(player, "onVideoTrackChange", rerender);

	const tracks = player.getAvailableVideoTracks();
	if (tracks.length <= 1) return null;

	return (
		<Menu
			Trigger={IconButton}
			icon={VideoSettings}
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

export const PlayModeContext = createContext<
	["direct" | "hls", (val: "direct" | "hls") => void]
>(null!);

export const QualityMenu = ({
	player,
	...props
}: { player: VideoPlayer } & Partial<MenuProps>) => {
	const { t } = useTranslation();
	const [playMode, setPlayMode] = useContext(PlayModeContext);
	const rerender = useForceRerender();

	useEvent(player, "onQualityChange", rerender);

	const lvls = player.getAvailableQualities();
	const current = player.currentQuality;
	const auto = player.autoQualityEnabled;

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
			<Menu.Item
				label={
					auto && current
						? `${t("player.auto")} (${current.id.includes("original") ? t("player.transmux") : `${current.height}p`})`
						: t("player.auto")
				}
				selected={auto && playMode === "hls"}
				onSelect={() => {
					setPlayMode("hls");
					player.selectQuality(null);
				}}
			/>
			{lvls
				.map((x) => (
					<Menu.Item
						key={x.id}
						label={
							x.id.includes("original")
								? `${t("player.transmux")} (${x.height}p)`
								: `${x.height}p`
						}
						selected={x.selected && !auto}
						onSelect={() => {
							setPlayMode("hls");
							player.selectQuality(x);
						}}
					/>
				))
				.reverse()}
		</Menu>
	);
};
