import ClosedCaption from "@material-symbols/svg-400/rounded/closed_caption-fill.svg";
import MusicNote from "@material-symbols/svg-400/rounded/music_note-fill.svg";
import SettingsIcon from "@material-symbols/svg-400/rounded/settings-fill.svg";
import VideoSettings from "@material-symbols/svg-400/rounded/video_settings-fill.svg";
import { type ComponentProps, createContext, useContext } from "react";
import { useTranslation } from "react-i18next";
import { useEvent, usePlayer } from "react-native-omni";
import { IconButton, Menu, tooltip } from "~/primitives";
import { useFetch } from "~/query";
import { useDisplayName, useSubtitleName } from "~/track-utils";
import { Info } from "~/ui/info";
import { useForceRerender, useQueryState } from "~/utils";

type MenuProps = ComponentProps<typeof Menu<ComponentProps<typeof IconButton>>>;

export const SubtitleMenu = (props: Partial<MenuProps>) => {
	const { t } = useTranslation();
	const getDisplayName = useSubtitleName();

	const player = usePlayer();
	const rerender = useForceRerender();
	useEvent("subtitleChange", rerender);
	const selectedIdx = player.subtitles.findIndex((x) => x.selected);

	const [slug] = useQueryState<string>("slug", undefined!);
	const { data } = useFetch(Info.infoQuery(slug));

	if (data?.subtitles.length === 0) return null;

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
				onSelect={() => player.selectSubtitle(undefined)}
			/>
			{data?.subtitles.map((x, i) => (
				<Menu.Item
					key={x.index ?? x.link}
					label={getDisplayName(x)}
					selected={i === selectedIdx}
					onSelect={() => player.selectSubtitle(player.subtitles[i])}
				/>
			))}
		</Menu>
	);
};

export const AudioMenu = (props: Partial<MenuProps>) => {
	const { t } = useTranslation();
	const getDisplayName = useDisplayName();

	const player = usePlayer();
	const rerender = useForceRerender();
	useEvent("audioTrackChange", rerender);

	const tracks = player.audios;
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
					onSelect={() => player.selectAudio(x)}
				/>
			))}
		</Menu>
	);
};

export const VideoMenu = (props: Partial<MenuProps>) => {
	const { t } = useTranslation();
	const getDisplayName = useDisplayName();

	const player = usePlayer();
	const rerender = useForceRerender();
	useEvent("videoTrackChange", rerender);

	const tracks = player.videos;
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
					onSelect={() => player.selectVideo(x)}
				/>
			))}
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
	const rerender = useForceRerender();

	useEvent("renditionChange", rerender);

	const lvls = player.rendition;
	const current = player.rendition.find((x) => x.selected);
	const auto = player.isAutoQuality;

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
					player.selectRendition(undefined);
				}}
			/>
			{lvls
				.reverse()
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
							player.selectRendition(x);
						}}
					/>
				))
				.reverse()}
		</Menu>
	);
};
