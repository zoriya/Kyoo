import MenuIcon from "@material-symbols/svg-400/rounded/menu-fill.svg";
import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { rem, useYoshiki } from "yoshiki/native";
import { EntryLine, entryDisplayNumber } from "~/components/entries";
import { Entry, Season } from "~/models";
import {
	Container,
	H2,
	HR,
	IconButton,
	Menu,
	P,
	Skeleton,
	tooltip,
	ts,
} from "~/primitives";
import { type QueryIdentifier, useInfiniteFetch } from "~/query";
import { InfiniteFetch } from "~/query/fetch-infinite";
import { EmptyView } from "~/ui/errors";

export const SeasonHeader = ({
	serieSlug,
	seasonNumber,
	name,
	seasons,
}: {
	serieSlug: string;
	seasonNumber: number;
	name: string | null;
	seasons: Season[];
}) => {
	const { css } = useYoshiki();
	const { t } = useTranslation();

	return (
		<View id={`season-${seasonNumber}`}>
			<View {...css({ flexDirection: "row", marginX: ts(1) })}>
				<P
					{...css({
						width: rem(4),
						flexShrink: 0,
						marginX: ts(1),
						textAlign: "center",
						fontSize: rem(1.5),
					})}
				>
					{seasonNumber}
				</P>
				<H2
					{...css({
						marginX: ts(1),
						fontSize: rem(1.5),
						flexGrow: 1,
						flexShrink: 1,
					})}
				>
					{name ?? t("show.season", { number: seasonNumber })}
				</H2>
				<Menu
					Trigger={IconButton}
					icon={MenuIcon}
					{...tooltip(t("show.jumpToSeason"))}
				>
					{seasons.map((x) => (
						<Menu.Item
							key={x.seasonNumber}
							label={`${x.seasonNumber}: ${
								x.name ?? t("show.season", { number: x.seasonNumber })
							} (${x.entriesCount})`}
							href={`/series/${serieSlug}?season=${x.seasonNumber}`}
						/>
					))}
				</Menu>
			</View>
			<HR />
		</View>
	);
};

SeasonHeader.Loader = () => {
	const { css } = useYoshiki();

	return (
		<View>
			<View
				{...css({
					flexDirection: "row",
					marginX: ts(1),
					justifyContent: "space-between",
				})}
			>
				<View {...css({ flexDirection: "row", alignItems: "center" })}>
					<Skeleton
						variant="custom"
						{...css({
							width: rem(4),
							flexShrink: 0,
							marginX: ts(1),
							height: rem(1.5),
						})}
					/>
					<Skeleton
						{...css({ marginX: ts(1), width: rem(12), height: rem(2) })}
					/>
				</View>
				<IconButton icon={MenuIcon} disabled />
			</View>
			<HR />
		</View>
	);
};

SeasonHeader.query = (slug: string): QueryIdentifier<Season> => ({
	parser: Season,
	path: ["api", "series", slug, "seasons"],
	params: {
		// I don't wanna deal with pagination, no serie has more than 100 seasons anyways, right?
		limit: 100,
	},
	infinite: true,
});

export const EntryList = ({
	slug,
	season,
	...props
}: {
	slug: string;
	season: string | number;
} & Partial<ComponentProps<typeof InfiniteFetch<Entry>>>) => {
	const { t } = useTranslation();
	const { items: seasons, error } = useInfiniteFetch(SeasonHeader.query(slug));

	if (error) console.error("Could not fetch seasons", error);

	return (
		<InfiniteFetch
			query={EntryList.query(slug, season)}
			layout={EntryLine.layout}
			Empty={<EmptyView message={t("show.episode-none")} />}
			divider={() => (
				<Container>
					<HR />
				</Container>
			)}
			// getItemType={(item) =>
			// 	item.kind === "episode" && item.episodeNumber === 1? "withHeader" : "normal"
			// }
			placeholderCount={5}
			Render={({ item }) => {
				const sea =
					item.kind === "episode" && item.episodeNumber === 1
						? seasons?.find((x) => x.seasonNumber === item.seasonNumber)
						: null;
				return (
					<Container>
						{sea && (
							<SeasonHeader
								serieSlug={slug}
								name={sea.name}
								seasonNumber={sea.seasonNumber}
								seasons={seasons ?? []}
							/>
						)}
						<EntryLine
							{...item}
							// Don't display "Go to serie"
							serieSlug={null}
							displayNumber={entryDisplayNumber(item)}
							watchedPercent={item.progress.percent}
						/>
					</Container>
				);
			}}
			Loader={({ index }) => (
				<Container>
					{index === 0 && <SeasonHeader.Loader />}
					<EntryLine.Loader />
				</Container>
			)}
			{...props}
		/>
	);
};

EntryList.query = (
	slug: string,
	season: string | number,
): QueryIdentifier<Entry> => ({
	parser: Entry,
	path: ["api", "series", slug, "entries"],
	params: {
		filter: season ? `seasonNumber gte ${season}` : undefined,
	},
	infinite: true,
});
