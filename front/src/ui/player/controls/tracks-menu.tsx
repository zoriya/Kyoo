import ClosedCaption from "@material-symbols/svg-400/rounded/closed_caption-fill.svg";
import MusicNote from "@material-symbols/svg-400/rounded/music_note-fill.svg";
import SettingsIcon from "@material-symbols/svg-400/rounded/settings-fill.svg";
import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { IconButton, Menu, tooltip } from "~/primitives";

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

export const AudioMenu = (props: Partial<MenuProps>) => {
	const { t } = useTranslation();

	return (
		<Menu
			Trigger={IconButton}
			icon={MusicNote}
			{...tooltip(t("player.audios"), true)}
			{...props}
		></Menu>
	);
};

export const QualityMenu = (props: Partial<MenuProps>) => {
	const { t } = useTranslation();

	return (
		<Menu
			Trigger={IconButton}
			icon={SettingsIcon}
			{...tooltip(t("player.quality"), true)}
			{...props}
		></Menu>
	);
};
