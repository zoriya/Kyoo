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

import { Font, Track } from "@kyoo/models";
import { IconButton, tooltip, Menu, ts } from "@kyoo/primitives";
import { useAtom, useSetAtom } from "jotai";
import { useEffect, useState } from "react";
import { Platform, View } from "react-native";
import { useTranslation } from "react-i18next";
import ClosedCaption from "@material-symbols/svg-400/rounded/closed_caption-fill.svg";
import Fullscreen from "@material-symbols/svg-400/rounded/fullscreen-fill.svg";
import FullscreenExit from "@material-symbols/svg-400/rounded/fullscreen_exit-fill.svg";
import { Stylable, useYoshiki } from "yoshiki/native";
import { createParam } from "solito";
import { fullscreenAtom, subtitleAtom } from "../state";

const { useParam } = createParam<{ subtitle?: string }>();

export const RightButtons = ({
	subtitles,
	fonts,
	onMenuOpen,
	onMenuClose,
	...props
}: {
	subtitles?: Track[];
	fonts?: Font[];
	onMenuOpen: () => void;
	onMenuClose: () => void;
} & Stylable) => {
	const { css } = useYoshiki();
	const { t } = useTranslation();
	const [isFullscreen, setFullscreen] = useAtom(fullscreenAtom);
	const setSubAtom = useSetAtom(subtitleAtom);
	const [selectedSubtitle, setSubtitle] = useState<string | undefined>(undefined);

	useEffect(() => {
		const sub =
			subtitles?.find(
				(x) => x.language === selectedSubtitle || x.id.toString() === selectedSubtitle,
			) ?? null;
		setSubAtom(sub);
	}, [subtitles, selectedSubtitle, setSubAtom]);

	const spacing = css({ marginHorizontal: ts(1) });

	return (
		<View {...css({ flexDirection: "row" }, props)}>
			{subtitles && (
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
						onSelect={() => setSubtitle(undefined)}
					/>
					{subtitles.map((x) => (
						<Menu.Item
							key={x.id}
							label={x.displayName}
							selected={selectedSubtitle === x.language || selectedSubtitle === x.id.toString()}
							onSelect={() => setSubtitle(x.language ?? x.id.toString())}
						/>
					))}
				</Menu>
			)}
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
