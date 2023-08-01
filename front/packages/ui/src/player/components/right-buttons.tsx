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

import { Subtitle, WatchItem } from "@kyoo/models";
import { IconButton, tooltip, Menu, ts } from "@kyoo/primitives";
import { useAtom } from "jotai";
import { Platform, View } from "react-native";
import { useTranslation } from "react-i18next";
import ClosedCaption from "@material-symbols/svg-400/rounded/closed_caption-fill.svg";
import Fullscreen from "@material-symbols/svg-400/rounded/fullscreen-fill.svg";
import FullscreenExit from "@material-symbols/svg-400/rounded/fullscreen_exit-fill.svg";
import SettingsIcon from "@material-symbols/svg-400/rounded/settings-fill.svg";
import MusicNote from "@material-symbols/svg-400/rounded/music_note-fill.svg";
import { Stylable, useYoshiki } from "yoshiki/native";
import { fullscreenAtom, subtitleAtom } from "../state";
import { AudiosMenu, QualitiesMenu } from "../video";
import i18next from "i18next";

export const getDisplayName = (sub: Subtitle) => {
	const languageNames = new Intl.DisplayNames([i18next.language ?? "en"], { type: "language" });
	const lng = sub.language ? languageNames.of(sub.language) : undefined;

	if (lng && sub.title) return `${lng} - ${sub.title}`;
	if (lng) return lng;
	if (sub.title) return sub.title;
	return `Unknwon (${sub.index})`;
};

export const RightButtons = ({
	subtitles,
	fonts,
	qualities,
	onMenuOpen,
	onMenuClose,
	...props
}: {
	subtitles?: Subtitle[];
	fonts?: string[];
	qualities?: WatchItem["link"];
	onMenuOpen: () => void;
	onMenuClose: () => void;
} & Stylable) => {
	const { css } = useYoshiki();
	const { t } = useTranslation();
	const [isFullscreen, setFullscreen] = useAtom(fullscreenAtom);
	const [selectedSubtitle, setSubtitle] = useAtom(subtitleAtom);

	const spacing = css({ marginHorizontal: ts(1) });

	return (
		<View {...css({ flexDirection: "row" }, props)}>
			{subtitles && subtitles.length > 0 && (
				<Menu
					Trigger={IconButton}
					icon={ClosedCaption}
					onMenuOpen={onMenuOpen}
					onMenuClose={onMenuClose}
					{...tooltip(t("player.subtitles"), true)}
					{...spacing}
				>
					<Menu.Item
						label={t("player.subtitle-none")}
						selected={!selectedSubtitle}
						onSelect={() => setSubtitle(null)}
					/>
					{subtitles.map((x) => (
						<Menu.Item
							key={x.index}
							label={x.link ? getDisplayName(x) : `${getDisplayName(x)} (${x.codec})`}
							selected={selectedSubtitle === x}
							disabled={!x.link}
							onSelect={() => setSubtitle(x)}
						/>
					))}
				</Menu>
			)}
			<AudiosMenu
				Trigger={IconButton}
				icon={MusicNote}
				onMenuOpen={onMenuOpen}
				onMenuClose={onMenuClose}
				{...tooltip(t("player.audios"), true)}
				{...spacing}
			/>
			<QualitiesMenu
				Trigger={IconButton}
				icon={SettingsIcon}
				onMenuOpen={onMenuOpen}
				onMenuClose={onMenuClose}
				{...tooltip(t("player.quality"), true)}
				{...spacing}
			/>
			{Platform.OS === "web" && (
				<IconButton
					icon={isFullscreen ? FullscreenExit : Fullscreen}
					onPress={() => setFullscreen(!isFullscreen)}
					{...tooltip(t("player.fullscreen"), true)}
					{...spacing}
				/>
			)}
		</View>
	);
};
