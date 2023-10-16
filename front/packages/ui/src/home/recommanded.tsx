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
	ItemKind,
	KyooImage,
	LibraryItem,
	LibraryItemP,
	Page,
	Paged,
	QueryIdentifier,
	getDisplayDate,
} from "@kyoo/models";
import { Container, H3, ImageBackground, P, Poster, SubP, ts } from "@kyoo/primitives";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { percent, useYoshiki } from "yoshiki/native";
import { Fetch, WithLoading } from "../fetch";

export const ItemDetails = ({
	isLoading,
	name,
	tagline,
	subtitle,
	overview,
	poster,
	...props
}: WithLoading<{
	name: string;
	tagline: string | null;
	subtitle: string;
	poster: KyooImage | null;
	overview: string | null;
}>) => {
	const { css } = useYoshiki();

	return (
		<View {...css({ flexDirection: "row", bg: (theme) => theme.variant.background }, props)}>
			<ImageBackground
				src={poster}
				alt=""
				quality="low"
				{...css({ height: percent(100), aspectRatio: 2 / 3 })}
			>
				<P>{name}</P>
				{subtitle && <SubP>{subtitle}</SubP>}
			</ImageBackground>
			<View>
				{tagline && <P>{tagline}</P>}
				{overview && <SubP>{overview}</SubP>}
			</View>
		</View>
	);
};

export const Recommanded = () => {
	const { t } = useTranslation();
	const { css } = useYoshiki();

	return (
		<View {...css({ marginX: ts(1) })}>
			<H3>{t("home.recommanded")}</H3>
			<Fetch query={Recommanded.query()}>
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
						{...css({ height: { xs: ts(15), md: ts(20) } })}
					/>
				)}
			</Fetch>
		</View>
	);
};

Recommanded.query = (): QueryIdentifier<Page<LibraryItem>> => ({
	parser: Paged(LibraryItemP) as any,
	path: ["items"],
	params: {
		sortBy: "random",
		limit: 6,
	},
});
