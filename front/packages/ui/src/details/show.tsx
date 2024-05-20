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
	type QueryIdentifier,
	type QueryPage,
	type Show,
	ShowP,
	type ShowWatchStatus,
} from "@kyoo/models";
import { Container, H2, SwitchVariant, focusReset, ts } from "@kyoo/primitives";
import { forwardRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Platform, View, type ViewProps } from "react-native";
import Svg, { Path, type SvgProps } from "react-native-svg";
import { percent, useYoshiki } from "yoshiki/native";
import { DefaultLayout } from "../layout";
import { DetailsCollections } from "./collection";
import { EpisodeLine, episodeDisplayNumber } from "./episode";
import { Header } from "./header";
import { EpisodeList, SeasonHeader } from "./season";

export const SvgWave = (props: SvgProps) => {
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

export const ShowWatchStatusCard = ({ watchedPercent, status, nextEpisode }: ShowWatchStatus) => {
	const { t } = useTranslation();
	const [focused, setFocus] = useState(false);

	if (!nextEpisode) return null;

	return (
		<SwitchVariant>
			{({ css }) => (
				<Container
					{...css([
						{
							marginY: ts(2),
							borderRadius: 16,
							overflow: "hidden",
							borderWidth: ts(0.5),
							borderStyle: "solid",
							borderColor: (theme) => theme.background,
							backgroundColor: (theme) => theme.background,
						},
						focused && {
							...focusReset,
							borderColor: (theme) => theme.accent,
						},
					])}
				>
					<H2 {...css({ marginLeft: ts(2) })}>{t("show.nextUp")}</H2>
					<EpisodeLine
						{...nextEpisode}
						showSlug={null}
						watchedPercent={watchedPercent || null}
						watchedStatus={status || null}
						displayNumber={episodeDisplayNumber(nextEpisode)}
						onHoverIn={() => setFocus(true)}
						onHoverOut={() => setFocus(false)}
						onFocus={() => setFocus(true)}
						onBlur={() => setFocus(false)}
					/>
				</Container>
			)}
		</SwitchVariant>
	);
};

const ShowHeader = forwardRef<View, ViewProps & { slug: string }>(function ShowHeader(
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
						overflowY: "auto" as any,
					},
				],
				props,
			)}
		>
			<Header type="show" query={query(slug)} />
			<DetailsCollections type="show" slug={slug} />
			{/* <Staff slug={slug} /> */}
			<SvgWave
				fill={theme.variant.background}
				{...css({ flexShrink: 0, flexGrow: 1, display: "flex" })}
			/>
			<View {...css({ bg: theme.variant.background })}>
				<Container>{children}</Container>
			</View>
		</View>
	);
});

const query = (slug: string): QueryIdentifier<Show> => ({
	parser: ShowP,
	path: ["show", slug],
	params: {
		fields: ["studio", "firstEpisode", "watchStatus"],
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
	DetailsCollections.query("show", slug),
	// ShowStaff.query(slug),
	EpisodeList.query(slug, season),
	SeasonHeader.query(slug),
];

ShowDetails.getLayout = { Layout: DefaultLayout, props: { transparent: true } };
