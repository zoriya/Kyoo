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

import { type KyooImage, type LibraryItem, LibraryItemP, type QueryIdentifier } from "@kyoo/models";
import {
	H1,
	H2,
	IconButton,
	IconFab,
	ImageBackground,
	Link,
	P,
	Skeleton,
	tooltip,
	ts,
} from "@kyoo/primitives";
import { View } from "react-native";
import { percent, rem, useYoshiki } from "yoshiki/native";
import type { WithLoading } from "../fetch";
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
				<Skeleton {...css({ width: rem(8), height: rem(2.5) })}>
					{isLoading || (
						<H1 numberOfLines={4} {...css({ fontSize: { xs: rem(2), sm: rem(3) } })}>
							{name}
						</H1>
					)}
				</Skeleton>
				<View {...css({ flexDirection: "row", alignItems: "center" })}>
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
					<Skeleton
						{...css({ width: rem(25), height: rem(2), display: { xs: "none", sm: "flex" } })}
					>
						{isLoading || <H2 {...css({ display: { xs: "none", sm: "flex" } })}>{tagline}</H2>}
					</Skeleton>
				</View>
				<Skeleton lines={4} {...css({ marginTop: ts(1) })}>
					{isLoading || (
						<P numberOfLines={4} {...css({ display: { xs: "none", md: "flex" } })}>
							{overview}
						</P>
					)}
				</Skeleton>
			</View>
		</ImageBackground>
	);
};

Header.query = (): QueryIdentifier<LibraryItem> => ({
	parser: LibraryItemP,
	path: ["items", "random"],
	params: {
		fields: ["firstEpisode"],
	},
});
