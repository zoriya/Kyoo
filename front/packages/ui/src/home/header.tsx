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

import { KyooImage, LibraryItem, LibraryItemP, QueryIdentifier } from "@kyoo/models";
import {
	H1,
	H2,
	IconButton,
	IconFab,
	ImageBackground,
	Link,
	P,
	tooltip,
	ts,
} from "@kyoo/primitives";
import { View } from "react-native";
import { percent, useYoshiki } from "yoshiki/native";
import { WithLoading } from "../fetch";
import { Header as DetailsHeader } from "../details/header";
import { useTranslation } from "react-i18next";
import PlayArrow from "@material-symbols/svg-400/rounded/play_arrow-fill.svg";
import Info from "@material-symbols/svg-400/rounded/info.svg";

export const Header = ({
	isLoading,
	name,
	thumbnail,
	overview,
	tagline,
	link,
	infoLink,
	...props
}: WithLoading<{
	name: string;
	thumbnail: KyooImage | null;
	overview: string | null;
	tagline: string | null;
	link: string | null;
	infoLink: string;
}>) => {
	const { css } = useYoshiki();
	const { t } = useTranslation();

	return (
		<ImageBackground
			src={thumbnail}
			alt=""
			quality="high"
			{...css(DetailsHeader.containerStyle, props)}
		>
			<View
				{...css({ width: { md: percent(70) }, position: "absolute", bottom: 0, margin: ts(2) })}
			>
				<H1>{name}</H1>
				<View {...css({ flexDirection: "row" })}>
					{link !== null && (
						<IconFab
							icon={PlayArrow}
							aria-label={t("show.play")}
							as={Link}
							href={link ?? "#"}
							{...tooltip(t("show.play"))}
							{...css({ marginRight: ts(1) })}
						/>
					)}
					<IconButton
						icon={Info}
						aria-label={t("home.info")}
						href={infoLink ?? "#"}
						{...tooltip(t("home.info"))}
						{...css({ marginRight: ts(2) })}
					/>
					<H2>{tagline}</H2>
				</View>
				<P {...css({ display: { xs: "none", md: "flex" } })}>{overview}</P>
			</View>
		</ImageBackground>
	);
};

Header.query = (): QueryIdentifier<LibraryItem> => ({
	parser: LibraryItemP,
	path: ["items", "random"],
});
