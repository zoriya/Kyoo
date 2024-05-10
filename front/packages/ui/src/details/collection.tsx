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
	type Collection,
	CollectionP,
	type KyooImage,
	type QueryIdentifier,
	useInfiniteFetch,
} from "@kyoo/models";
import { Container, H2, ImageBackground, Link, P, focusReset, ts } from "@kyoo/primitives";
import { useTranslation } from "react-i18next";
import { type Theme, useYoshiki } from "yoshiki/native";
import { ErrorView } from "../errors";

export const PartOf = ({
	name,
	overview,
	thumbnail,
	href,
}: {
	name: string;
	overview: string | null;
	thumbnail: KyooImage | null;
	href: string;
}) => {
	const { css, theme } = useYoshiki("part-of-collection");
	const { t } = useTranslation();

	return (
		<Link
			href={href}
			{...css({
				borderRadius: 16,
				overflow: "hidden",
				borderWidth: ts(0.5),
				borderStyle: "solid",
				borderColor: (theme) => theme.background,
				fover: {
					self: { ...focusReset, borderColor: (theme: Theme) => theme.accent },
					title: { textDecorationLine: "underline" },
				},
			})}
		>
			<ImageBackground
				src={thumbnail}
				alt=""
				quality="medium"
				gradient={{ colors: [theme.darkOverlay, theme.darkOverlay] }}
				{...css({
					padding: ts(3),
				})}
			>
				<H2 {...css("title")}>
					{t("show.partOf")} {name}
				</H2>
				<P {...css({ textAlign: "justify" })}>{overview}</P>
			</ImageBackground>
		</Link>
	);
};

export const DetailsCollections = ({ type, slug }: { type: "movie" | "show"; slug: string }) => {
	const { items, error } = useInfiniteFetch(DetailsCollections.query(type, slug));
	const { css } = useYoshiki();

	if (error) return <ErrorView error={error} />;

	// Since most items dont have collections, not having a skeleton reduces layout shifts.
	if (!items) return null;

	return (
		<Container {...css({ marginY: ts(2) })}>
			{items.map((x) => (
				<PartOf
					key={x.id}
					name={x.name}
					overview={x.overview}
					thumbnail={x.thumbnail}
					href={x.href}
				/>
			))}
		</Container>
	);
};

DetailsCollections.query = (type: "movie" | "show", slug: string): QueryIdentifier<Collection> => ({
	parser: CollectionP,
	path: [type, slug, "collections"],
	params: {
		limit: 0,
	},
	infinite: true,
});
