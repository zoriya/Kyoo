import ClosedCaption from "@material-symbols/svg-400/rounded/closed_caption-fill.svg";
import MusicNote from "@material-symbols/svg-400/rounded/music_note-fill.svg";
import SettingsIcon from "@material-symbols/svg-400/rounded/settings-fill.svg";
import VideoSettings from "@material-symbols/svg-400/rounded/video_settings-fill.svg";
import { type ComponentProps, createContext, useContext } from "react";
import { useTranslation } from "react-i18next";
import { usePlayer, usePlayerState } from "react-native-omni";
import { IconButton, Menu, tooltip } from "~/primitives";
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

	if (tracks.length <= 1) return null;

	return (
		<Menu
			Trigger={IconButton}
			icon={MusicNote}
			{...tooltip(t("player.audios"), true)}
			{...props}
		>
			{() => (
				<>
					{tracks.map((x) => (
						<Menu.Item
							key={x.id}
							label={getDisplayName({ title: x.label, language: x.language })}
							selected={x.selected}
							onSelect={() => player.selectAudio(x)}
						/>
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
	["direct" | "hls", (val: "direct" | "hls") => void]
>(null!);

export const QualityMenu = (props: Partial<MenuProps>) => {
	const { t } = useTranslation();
	const [playMode, setPlayMode] = useContext(PlayModeContext);
	const player = usePlayer();
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
