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

import { Episode, EpisodeP, QueryIdentifier, Season } from "@kyoo/models";
import { Container, SwitchVariant, ts } from "@kyoo/primitives";
import Svg, { SvgProps, Path } from "react-native-svg";
import { Stylable } from "yoshiki/native";
import { View } from "react-native";
import { InfiniteFetch } from "../fetch-infinite";
import { episodeDisplayNumber, EpisodeLine } from "./episode";
import { useTranslation } from "react-i18next";

const EpisodeGrid = ({ slug, season }: { slug: string; season: string | number }) => {
	const { t } = useTranslation();

	return (
		<InfiniteFetch
			query={EpisodeGrid.query(slug, season)}
			placeholderCount={15}
			layout={EpisodeLine.layout}
			empty={t("show.episode-none")}
			divider
		>
			{(item) => (
				<EpisodeLine
					{...item}
					displayNumber={item.isLoading ? undefined : episodeDisplayNumber(item)}
				/>
			)}
		</InfiniteFetch>
	);
};

EpisodeGrid.query = (slug: string, season: string | number): QueryIdentifier<Episode> => ({
	parser: EpisodeP,
	path: ["shows", slug, "episode"],
	params: {
		seasonNumber: season,
	},
	infinite: true,
});

const SvgWave = (props: SvgProps) => (
	<Svg viewBox="0 372.979 612 52.771" {...props}>
		<Path d="M0 375.175c68-5.1 136-.85 204 7.948 68 9.052 136 22.652 204 24.777s136-8.075 170-12.878l34-4.973v35.7H0" />
	</Svg>
);

export const SeasonTab = ({
	slug,
	season,
	...props
}: { slug: string; season: number | string } & Stylable) => {
	// TODO: handle absolute number only shows (without seasons)
	return (
		<SwitchVariant>
			{({ css, theme }) => (
				<View>
					<SvgWave fill={theme.background} {...css({ marginTop: { xs: ts(2), md: 0 } })} />
					<View {...css({ bg: (theme) => theme.background }, props)}>
						<Container>
							{/* <Tabs value={season} onChange={(_, i) => setSeason(i)} aria-label="List of seasons"> */}
							{/* 	{seasons */}
							{/* 		? seasons.map((x) => ( */}
							{/* 				<Tab */}
							{/* 					key={x.seasonNumber} */}
							{/* 					label={x.name} */}
							{/* 					value={x.seasonNumber} */}
							{/* 					component={Link} */}
							{/* 					to={{ query: { ...router.query, season: x.seasonNumber } }} */}
							{/* 					shallow */}
							{/* 					replace */}
							{/* 				/> */}
							{/* 		  )) */}
							{/* 		: [...Array(3)].map((_, i) => ( */}
							{/* 				<Tab key={i} label={<Skeleton width="5rem" />} value={i + 1} disabled /> */}
							{/* 		  ))} */}
							{/* </Tabs> */}
							<EpisodeGrid slug={slug} season={season} />
						</Container>
					</View>
				</View>
			)}
		</SwitchVariant>
	);
};
