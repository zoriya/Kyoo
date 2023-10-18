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

import {
	Genre,
	ItemKind,
	KyooImage,
	LibraryItem,
	LibraryItemP,
	Page,
	Paged,
	QueryIdentifier,
	getDisplayDate,
} from "@kyoo/models";
import { Chip, Container, H3, ImageBackground, P, Poster, SubP, alpha, ts } from "@kyoo/primitives";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";
import { percent, px, useYoshiki } from "yoshiki/native";
import { Fetch, Layout, WithLoading } from "../fetch";
import { InfiniteFetch } from "../fetch-infinite";

export const ItemDetails = ({
	isLoading,
	name,
	tagline,
	subtitle,
	overview,
	poster,
	genres,
	...props
}: WithLoading<{
	name: string;
	tagline: string | null;
	subtitle: string;
	poster: KyooImage | null;
	genres: Genre[] | null;
	overview: string | null;
}>) => {
	const { css } = useYoshiki();

	return (
		<View
			{...css(
				{
					height: ItemDetails.layout.size,
					flexDirection: "row",
					bg: (theme) => theme.variant.background,
					borderRadius: 6,
					overflow: "hidden",
				},
				props,
			)}
		>
			<ImageBackground
				src={poster}
				alt=""
				quality="low"
				gradient={false}
				{...css({ height: percent(100), aspectRatio: 2 / 3 })}
			>
				<View
					{...css({
						bg: (theme) => theme.darkOverlay,
						position: "absolute",
						left: 0,
						right: 0,
						bottom: 0,
						p: ts(1),
					})}
				>
					<P {...css({ m: 0 })}>{name}</P>
					{subtitle && <SubP {...css({ m: 0 })}>{subtitle}</SubP>}
				</View>
			</ImageBackground>
			<View {...css({ flexShrink: 1, flexGrow: 1 })}>
				{tagline && <P {...css({ p: ts(1) })}>{tagline}</P>}
				{overview && (
					<ScrollView>
						<SubP {...css({ pX: ts(1) })}>{overview}</SubP>
					</ScrollView>
				)}
				<View {...css({ bg: (theme) => theme.themeOverlay, flexDirection: "row" })}>
					{genres?.map((x) => (
						<Chip key={x} label={x} {...css({ mX: ts(.5) })} />
					))}
				</View>
			</View>
		</View>
	);
};

ItemDetails.layout = {
	size: ts(36),
	numColumns: { xs: 1, md: 2, xl: 3 },
	layout: "grid",
	gap: ts(8),
} satisfies Layout;

export const Recommanded = () => {
	const { t } = useTranslation();
	const { css } = useYoshiki();

	return (
		<View {...css({ marginX: ts(1) })}>
			<H3>{t("home.recommanded")}</H3>
			<InfiniteFetch query={Recommanded.query()} layout={ItemDetails.layout}>
				{(x, i) => (
					<ItemDetails
						key={x.id ?? i}
						isLoading={x.isLoading as any}
						name={x.name}
						tagline={"tagline" in x ? x.tagline : null}
						overview={x.overview}
						poster={x.poster}
						subtitle={
							x.kind !== ItemKind.Collection && !x.isLoading ? getDisplayDate(x) : undefined
						}
						genres={"genres" in x ? x.genres : null}
					/>
				)}
			</InfiniteFetch>
		</View>
	);
};

Recommanded.query = (): QueryIdentifier<LibraryItem> => ({
	parser: LibraryItemP,
	infinite: true,
	path: ["items"],
	params: {
		sortBy: "random",
		limit: 6,
	},
});
