import MenuIcon from "@material-symbols/svg-400/rounded/menu-fill.svg";
import { useRouter } from "expo-router";
import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import z from "zod";
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
} from "~/primitives";
import { type QueryIdentifier, useInfiniteFetch } from "~/query";
import { InfiniteFetch } from "~/query/fetch-infinite";
import { EmptyView } from "~/ui/errors";
import { cn } from "~/utils";

export const SeasonHeader = ({
	serieSlug,
	seasonNumber,
	name,
	seasons,
	className,
	...props
}: {
	serieSlug: string;
	seasonNumber: number;
	name: string | null;
	seasons: Season[];
	className?: string;
}) => {
	const { t } = useTranslation();
	const router = useRouter();

	return (
		<View
			id={`season-${seasonNumber}`}
			className={cn("m-1 flex-row", className)}
			{...props}
		>
			<P className="mx-1 w-16 shrink-0 text-center text-2xl">{seasonNumber}</P>
			<H2 className="mx-1 flex-1 text-2xl">
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
						onSelect={() => router.setParams({ season: x.seasonNumber })}
					/>
				))}
			</Menu>
		</View>
	);
};

SeasonHeader.Loader = ({ className, ...props }: { className?: string }) => {
	return (
		<View className={cn("m-1 flex-row items-center", className)} {...props}>
			<View className="flex-1 flex-row items-center">
				<Skeleton variant="custom" className="mx-1 h-6 w-8 shrink-0" />
				<Skeleton className="mx-2 h-8 w-1/5" />
			</View>
			<IconButton icon={MenuIcon} disabled />
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
} & Partial<ComponentProps<typeof InfiniteFetch<EntryOrSeason>>>) => {
	const { t } = useTranslation();
	const { items: seasons, error } = useInfiniteFetch(SeasonHeader.query(slug));

	if (error) console.error("Could not fetch seasons", error);

	return (
		<InfiniteFetch
			query={EntryList.query(slug, season)}
			layout={EntryLine.layout}
			Empty={<EmptyView message={t("show.episode-none")} />}
			Divider={() => <Container as={HR} />}
			getItemType={(item, idx) =>
				item ? item.kind : idx === 0 ? "season" : "episode"
			}
			getStickyIndices={(items) =>
				items
					.map((x, i) => (x.kind === "season" ? i : null))
					.filter((x) => x !== null)
			}
			placeholderCount={5}
			Render={({ item }) =>
				item.kind === "season" ? (
					<Container
						as={SeasonHeader}
						serieSlug={slug}
						name={item.name}
						seasonNumber={item.seasonNumber}
						seasons={seasons ?? []}
					/>
				) : (
					<Container
						as={EntryLine}
						{...item}
						// Don't display "Go to serie"
						serieSlug={null}
						displayNumber={entryDisplayNumber(item)}
						watchedPercent={item.progress.percent}
					/>
				)
			}
			Loader={({ index }) =>
				index === 0 ? (
					<Container as={SeasonHeader.Loader} />
				) : (
					<Container as={EntryLine.Loader} />
				)
			}
			{...props}
		/>
	);
};

const EntryOrSeason = z.union([
	Season.extend({ kind: z.literal("season") }),
	Entry,
]);
type EntryOrSeason = z.infer<typeof EntryOrSeason>;

EntryList.query = (
	slug: string,
	season: string | number,
): QueryIdentifier<EntryOrSeason> => ({
	parser: EntryOrSeason,
	path: ["api", "series", slug, "entries"],
	params: {
		// TODO: use a better filter, it removes specials and movies
		filter: season ? `seasonNumber ge ${season}` : undefined,
		includeSeasons: true,
	},
	infinite: true,
});
