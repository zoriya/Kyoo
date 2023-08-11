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

import { QueryIdentifier, QueryPage, Show, ShowP } from "@kyoo/models";
import { Platform, View, ViewProps } from "react-native";
import { percent, useYoshiki } from "yoshiki/native";
import { DefaultLayout } from "../layout";
import { EpisodeList } from "./season";
import { Header } from "./header";
import Svg, { Path, SvgProps } from "react-native-svg";
import { Container, SwitchVariant } from "@kyoo/primitives";
import { forwardRef, useCallback } from "react";

const SvgWave = (props: SvgProps) => {
	const { css } = useYoshiki();
	const width = 612;
	const height = 52.771;

	return (
		<View {...css({ width: percent(100), aspectRatio: width / height })}>
			<Svg width="100%" height="100%" viewBox="0 372.979 612 52.771" fill="black" {...props}>
				<Path d="M0,375.175c68,-5.1,136,-0.85,204,7.948c68,9.052,136,22.652,204,24.777s136,-8.075,170,-12.878l34,-4.973v35.7h-612" />
			</Svg>
		</View>
	);
};

const ShowHeader = forwardRef<View, ViewProps & { slug: string }>(function _ShowHeader(
	{ children, slug, ...props },
	ref,
) {
	const { css, theme } = useYoshiki();

	return (
		<View
			ref={ref}
			{...css(
				[
					{ bg: (theme) => theme.background },
					Platform.OS === "web" && {
						flexGrow: 1,
						flexShrink: 1,
						// @ts-ignore Web only property
						overflow: "auto" as any,
						// @ts-ignore Web only property
						overflowX: "hidden",
						// @ts-ignore Web only property
						overflowY: "overlay",
					},
				],
				props,
			)}
		>
			{/* TODO: Remove the slug quickfix for the play button */}
			<Header slug={`${slug}-s1e1`} query={query(slug)} />
			{/* <Staff slug={slug} /> */}
			<SvgWave
				fill={theme.variant.background}
				{...css({ flexShrink: 0, flexGrow: 1, display: "flex" })}
			/>
			{/* <SeasonTab slug={slug} season={season} /> */}
			<View {...css({ bg: theme.variant.background })}>
				<Container>{children}</Container>
			</View>
		</View>
	);
});

const query = (slug: string): QueryIdentifier<Show> => ({
	parser: ShowP,
	path: ["shows", slug],
	params: {
		fields: ["studio"],
	},
});

export const ShowDetails: QueryPage<{ slug: string; season: string }> = ({ slug, season }) => {
	const { css, theme } = useYoshiki();
	return (
		<View {...css({ bg: theme.variant.background, flex: 1 })}>
			<EpisodeList slug={slug} season={season} Header={ShowHeader} headerProps={{ slug }} />
		</View>
	);
};

ShowDetails.getFetchUrls = ({ slug, season }) => [
	query(slug),
	// ShowStaff.query(slug),
	EpisodeList.query(slug, season),
];

ShowDetails.getLayout = { Layout: DefaultLayout, props: { transparent: true } };
