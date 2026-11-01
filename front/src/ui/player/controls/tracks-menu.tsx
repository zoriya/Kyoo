import ClosedCaption from "@material-symbols/svg-400/rounded/closed_caption-fill.svg";
import MusicNote from "@material-symbols/svg-400/rounded/music_note-fill.svg";
import SettingsIcon from "@material-symbols/svg-400/rounded/settings-fill.svg";
import PlayerI from "@material-symbols/svg-400/rounded/smart_display.svg";
import VideoSettings from "@material-symbols/svg-400/rounded/video_settings-fill.svg";
import { type ComponentProps, createContext, useContext } from "react";
import { useTranslation } from "react-i18next";
import { Platform } from "react-native";
import {
	type AndroidBackend,
	usePlayer,
	usePlayerState,
} from "react-native-omni";
import { HR, IconButton, Menu, tooltip } from "~/primitives";
import { useLocalSetting } from "~/providers/settings";
import { useFetch } from "~/query";
import { useDisplayName, useSubtitleName } from "~/track-utils";
import { Info } from "~/ui/info";
import { useQueryState } from "~/utils";

type MenuProps = ComponentProps<typeof Menu<ComponentProps<typeof IconButton>>>;

export const SubtitleMenu = (props: Partial<MenuProps>) => {
	const { t } = useTranslation();
	const getSubtitleName = useSubtitleName();
	const getDisplayName = useDisplayName();

	const player = usePlayer();
	const subtitles = usePlayerState("subtitles");

	const [slug] = useQueryState<string>("slug", undefined!);
	const { data } = useFetch(Info.infoQuery(slug));

	if (subtitles.length === 0) return null;

	return (
		<Menu
			Trigger={IconButton}
			icon={ClosedCaption}
			{...tooltip(t("player.subtitles"), true)}
			{...props}
		>
			{() => (
				<>
					<Menu.Item
						label={t("player.subtitle-none")}
						selected={!subtitles.some((x) => x.selected)}
						onSelect={() => player.selectSubtitle(undefined)}
					/>
					{subtitles.map((track) => {
						const info =
							track.index >= 0
								? data?.subtitles.find((x) => x.index === track.index)
								: data?.subtitles.find(
										(x, i) => (x.index ?? i).toString() === track.id,
									);
						return (
							<Menu.Item
								key={track.id}
								label={
									info
										? getSubtitleName(info)
										: getDisplayName({
												title: track.label,
												language: track.language,
											})
								}
								selected={track.selected}
								onSelect={() => player.selectSubtitle(track)}
							/>
						);
					})}
				</>
			)}
		</Menu>
	);
};

export const AudioMenu = (props: Partial<MenuProps>) => {
	const { t } = useTranslation();
	const getDisplayName = useDisplayName();

	const player = usePlayer();
	const tracks = usePlayerState("audios");
	const [playMode, setPlayMode] = useContext(PlayModeContext) ?? [];

	const [slug] = useQueryState<string>("slug", undefined!);
	const { data } = useFetch(Info.infoQuery(slug));
	const audios = data?.audios ?? [];

	const directAudio = audios.find((x) => x.isDefault) ?? audios[0];
	// browsers don't list the audio tracks of a direct play, use the info ones
	// and switch to hls to change it.
	const items =
		playMode === "direct" && tracks.length < audios.length
			? audios.map((x, i) => ({
					id: x.index.toString(),
					label: getDisplayName(x),
					selected: x === directAudio,
					onSelect: () => {
						if (x !== directAudio) setPlayMode?.("hls", i);
					},
				}))
			: tracks.map((x) => ({
					id: x.id,
					label: getDisplayName({ title: x.label, language: x.language }),
					selected: x.selected,
					onSelect: () => player.selectAudio(x),
				}));

	if (items.length <= 1) return null;

	return (
		<Menu
			Trigger={IconButton}
			icon={MusicNote}
			{...tooltip(t("player.audios"), true)}
			{...props}
		>
			{() => (
				<>
					{items.map(({ id, ...x }) => (
						<Menu.Item key={id} {...x} />
					))}
				</>
			)}
		</Menu>
	);
};

export const VideoMenu = (props: Partial<MenuProps>) => {
	const { t } = useTranslation();
	const getDisplayName = useDisplayName();

	const player = usePlayer();
	const tracks = usePlayerState("videos");

	if (tracks.length <= 1) return null;

	return (
		<Menu
			Trigger={IconButton}
			icon={VideoSettings}
			{...tooltip(t("player.videos"), true)}
			{...props}
		>
			{() => (
				<>
					{tracks.map((x) => (
						<Menu.Item
							key={x.id}
							label={getDisplayName({ title: x.label, language: x.language })}
							selected={x.selected}
							onSelect={() => player.selectVideo(x)}
						/>
					))}
				</>
			)}
		</Menu>
	);
};

export const PlayModeContext = createContext<
	["direct" | "hls", (val: "direct" | "hls", audio?: number) => void]
>(null!);

export const QualityMenu = (props: Partial<MenuProps>) => {
	const { t } = useTranslation();
	const [playMode, setPlayMode] = useContext(PlayModeContext);
	const [backend, setBackend] = useLocalSetting<AndroidBackend>(
		"player",
		"auto",
	);
	const player = usePlayer();
	const activeBackend = usePlayerState("backend");
	const lvls = usePlayerState("renditions");
	const isAuto = usePlayerState("isAutoQuality");
	const current = lvls.find((x) => x.selected);

	return (
		<Menu
			Trigger={IconButton}
			icon={SettingsIcon}
			{...tooltip(t("player.quality"), true)}
			{...props}
		>
			{() => (
				<>
					{Platform.OS === "android" && (
						<>
							<Menu.Sub
								label={`${t("settings.playback.player.label")}: ${
									backend === "auto"
										? `${t("settings.playback.player.auto")} (${t(`settings.playback.player.${activeBackend as AndroidBackend}`)})`
										: t(`settings.playback.player.${backend}`)
								}`}
								icon={PlayerI}
							>
								{(["auto", "vlc", "exoplayer"] as const).map((x) => (
									<Menu.Item
										key={x}
										label={t(`settings.playback.player.${x}`)}
										selected={x === backend}
										onSelect={() => setBackend(x)}
									/>
								))}
							</Menu.Sub>
							<HR />
						</>
					)}
					<Menu.Item
						label={t("player.direct")}
						selected={playMode === "direct"}
						onSelect={() => setPlayMode("direct")}
					/>
					<Menu.Item
						label={
							isAuto && current
								? `${t("player.auto")} (${current.id.includes("original") ? t("player.transmux") : `${current.height}p`})`
								: t("player.auto")
						}
						selected={isAuto && playMode === "hls"}
						onSelect={() => {
							setPlayMode("hls");
							player.selectRendition(undefined);
						}}
					/>
					{playMode !== "direct" &&
						[...lvls].reverse().map((x) => (
							<Menu.Item
								key={x.id}
								label={
									x.id.includes("original")
										? `${t("player.transmux")} (${x.height}p)`
										: `${x.height}p`
								}
								selected={x.selected && !isAuto}
								onSelect={() => {
									setPlayMode("hls");
									player.selectRendition(x);
								}}
							/>
						))}
				</>
			)}
		</Menu>
	);
};
