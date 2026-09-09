import MenuIcon from "@material-symbols/svg-400/rounded/menu-fill.svg";
import MoreVert from "@material-symbols/svg-400/rounded/more_vert.svg";
import {
	and,
	eq,
	gte,
	ilike,
	isNull,
	not,
	or,
	useLiveQuery,
} from "@tanstack/react-db";
import { useRouter } from "expo-router";
import { useContext, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import z from "zod";
import { EntryLine, entryDisplayNumber } from "~/components/entries";
import { watchListIcon } from "~/components/items/watchlist-info";
import { entries, type EntryRow, type SeasonRow, seasons, } from "~/db";
import type { Entry, Season } from "~/models";
import { Paged } from "~/models/utils/page";
import {
	Container,
	FocusGroup,
	H2,
	HR,
	IconButton,
	Menu,
	P,
	Skeleton,
	tooltip,
} from "~/primitives";
import { AccountContext, useAccount } from "~/providers/account-context";
import { keyToUrl, queryFn, toQueryKey } from "~/query";
import { InfiniteList, type InfiniteViewProps } from "~/query/fetch-infinite";
import { EmptyView } from "~/ui/empty-view";
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
	const account = useAccount();
	const { apiUrl, authToken } = useContext(AccountContext);

	return (
		<FocusGroup
			autoFocus
			focusable
			scrollSnapAlign="center"
			id={`season-${seasonNumber}`}
			className={cn("m-1 w-full flex-1 flex-row", className)}
			{...props}
		>
			<P className="mx-1 w-16 shrink-0 text-center text-2xl text-accent">
				{seasonNumber}
			</P>
			<H2 className="mx-1 flex-1 text-2xl">
				{name ?? t("show.season", { number: seasonNumber })}
			</H2>
			<Menu Trigger={IconButton} icon={MoreVert} {...tooltip(t("misc.more"))}>
				{() => (
					<>
						{account && (
							<Menu.Item
								label={t("show.watchlistMark.completed")}
								icon={watchListIcon("completed")}
								onSelect={async () => {
									const page = await queryFn({
										url: keyToUrl(
											toQueryKey({
												apiUrl,
												path: ["api", "series", serieSlug, "entries"],
												params: {
													filter: `seasonNumber eq ${seasonNumber}`,
													limit: 250,
												},
											}),
										),
										authToken: authToken ?? null,
										parser: Paged(
											z.object({
												id: z.string(),
												slug: z.string(),
											}),
										),
									});
									if (page.items.length === 0) return;
									// Most of the season is not local: plain api call, the ws
									// events patch the entries we have and re-fetch the show.
									await queryFn({
										method: "POST",
										url: keyToUrl(
											toQueryKey({
												apiUrl,
												path: ["api", "profiles", "me", "history"],
											}),
										),
										body: page.items.map((x) => ({
											percent: 100,
											entry: x.slug,
											videoId: null,
											time: 0,
											playedDate: null,
											external: true,
										})),
										authToken: authToken ?? null,
										parser: null,
									});
								}}
							/>
						)}
					</>
				)}
			</Menu>
			<Menu
				Trigger={IconButton}
				icon={MenuIcon}
				{...tooltip(t("show.jumpToSeason"))}
			>
				{() => (
					<>
						{seasons.map((x) => (
							<Menu.Item
								key={x.seasonNumber}
								label={`${x.seasonNumber}: ${
									x.name ?? t("show.season", { number: x.seasonNumber })
								} (${x.entriesCount})`}
								onSelect={() => router.setParams({ season: x.seasonNumber })}
							/>
						))}
					</>
				)}
			</Menu>
		</FocusGroup>
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

type EntryOrSeason = EntryRow | (SeasonRow & { kind: "season" });

export const EntryList = ({
	slug,
	season,
	currentEntrySlug,
	onSelectVideos,
	search,
	withContainer,
	stickyHeaderConfig,
	...props
}: {
	slug: string;
	season: string | number;
	currentEntrySlug?: string;
	onSelectVideos?: (entry: {
		displayNumber: string;
		name: string | null;
		videos: Entry["videos"];
	}) => void;
	search?: string;
	withContainer?: boolean;
} & Partial<InfiniteViewProps<EntryOrSeason>>) => {
	const { t } = useTranslation();
	const { data: seasonRows } = useLiveQuery((q) =>
		q
			.from({ se: seasons })
			.where(({ se }) => eq(se.showSlug, slug))
			.orderBy(({ se }) => se.seasonNumber),
	);
	// A season header before the first entry of each season (the api used to
	// interleave them with `includeSeasons`, the local db does it itself).
	const interleave = useMemo(
		() => (rows: EntryRow[]) =>
			rows.flatMap((entry, i): EntryOrSeason[] => {
				const previous = rows[i - 1];
				if (
					entry.kind !== "episode" ||
					previous?.seasonNumber === entry.seasonNumber
				)
					return [entry];
				const season = seasonRows.find(
					(x) => x.seasonNumber === entry.seasonNumber,
				);
				return season ? [{ ...season, kind: "season" }, entry] : [entry];
			}),
		[seasonRows],
	);

	const C = withContainer ? Container : View;

	return (
		<InfiniteList
			query={(q) =>
				q
					.from({ e: entries })
					.where(({ e }) =>
						and(
							eq(e.showSlug, slug),
							// TODO: use a better filter, it removes specials and movies
							or(
								eq(e.kind, "episode"),
								not(isNull(e.availableSince)),
								eq(e.content, "story"),
							),
							...(season ? [gte(e.seasonNumber, Number(season))] : []),
							...(search ? [ilike(e.name, `%${search}%`)] : []),
						),
					)
					.orderBy(({ e }) => e.order)
			}
			transform={interleave}
			layout={EntryLine.layout}
			snapToAlignment="item"
			drawDistance={1000}
			Empty={<EmptyView message={t("show.episode-none")} />}
			Divider={() => (
				<C>
					<HR />
				</C>
			)}
			getItemType={(item, idx) =>
				item ? item.kind : idx === 0 ? "season" : "episode"
			}
			getStickyIndices={(items) =>
				items
					.map((x, i) => (x.kind === "season" ? i : null))
					.filter((x) => x !== null)
			}
			placeholderCount={5}
			Render={({ item }) => (
				<C>
					{item.kind === "season" ? (
						<SeasonHeader
							serieSlug={slug}
							name={item.name}
							seasonNumber={item.seasonNumber}
							seasons={seasonRows}
						/>
					) : (
						<EntryLine
							{...item}
							videos={item.videos}
							className={
								item.slug === currentEntrySlug
									? "rounded-md bg-accent/10"
									: undefined
							}
							hasTVPreferredFocus={item.slug === currentEntrySlug}
							// Don't display "Go to serie"
							serieSlug={null}
							displayNumber={entryDisplayNumber(item)}
							watchedPercent={item.progress.percent}
							onSelectVideos={() =>
								onSelectVideos?.({
									displayNumber: entryDisplayNumber(item),
									name: item.name,
									videos: item.videos,
								})
							}
						/>
					)}
				</C>
			)}
			Loader={({ index }) => (
				<C>{index === 0 ? <SeasonHeader.Loader /> : <EntryLine.Loader />}</C>
			)}
			stickyHeaderConfig={{
				...stickyHeaderConfig,
				backdropComponent: () => (
					// hr bottom margin is m-4 and layout gap is 2 but it's only applied on the web and idk why
					<View className="absolute inset-0 mb-4 web:mb-6 bg-card" />
				),
			}}
			{...props}
		/>
	);
};
