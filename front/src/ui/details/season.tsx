import MenuIcon from "@material-symbols/svg-400/rounded/menu-fill.svg";
import MoreVert from "@material-symbols/svg-400/rounded/more_vert.svg";
import { useRouter } from "expo-router";
import { type ComponentProps, useContext } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import z from "zod";
import { EntryLine, entryDisplayNumber } from "~/components/entries";
import { watchListIcon } from "~/components/items/watchlist-info";
import { Entry, Season } from "~/models";
import { Paged } from "~/models/utils/page";
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
import { AccountContext, useAccount } from "~/providers/account-context";
import {
	keyToUrl,
	type QueryIdentifier,
	queryFn,
	toQueryKey,
	useInfiniteFetch,
	useMutation,
} from "~/query";
import { InfiniteFetch } from "~/query/fetch-infinite";
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

	const markAsSeen = useMutation({
		method: "POST",
		path: ["api", "profiles", "me", "history"],
		compute: (entries: string[]) => ({
			body: entries.map((entry) => ({
				percent: 100,
				entry,
				videoId: null,
				time: 0,
				playedDate: null,
				external: true,
			})),
		}),
		invalidate: ["api", "series", serieSlug, "entries"],
	});

	return (
		<View
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
									if (markAsSeen.isPending) return;

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
												slug: z.string(),
											}),
										),
									});
									const entries = page.items.map((x) => x.slug);
									if (entries.length === 0) return;
									await markAsSeen.mutateAsync(entries);
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
} & Partial<ComponentProps<typeof InfiniteFetch<EntryOrSeason>>>) => {
	const { t } = useTranslation();
	const { items: seasons, error } = useInfiniteFetch(SeasonHeader.query(slug));

	if (error) console.error("Could not fetch seasons", error);

	const C = withContainer ? Container : View;

	return (
		<InfiniteFetch
			query={EntryList.query(slug, season, search)}
			layout={EntryLine.layout}
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
							seasons={seasons ?? []}
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

const EntryOrSeason = z.union([
	Season.extend({ kind: z.literal("season") }),
	Entry,
]);
type EntryOrSeason = z.infer<typeof EntryOrSeason>;

EntryList.query = (
	slug: string,
	season: string | number,
	query: string | undefined,
): QueryIdentifier<EntryOrSeason> => ({
	parser: EntryOrSeason,
	path: ["api", "series", slug, "entries"],
	params: {
		query,
		filter: [
			// TODO: use a better filter, it removes specials and movies
			season && `seasonNumber ge ${season}`,
			"(kind eq episode or isAvailable eq true or content eq story)",
		]
			.filter((x) => x)
			.join(" and "),
		includeSeasons: true,
	},
	infinite: true,
});
