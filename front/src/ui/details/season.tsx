import { Union } from "@data-client/rest";
import MenuIcon from "@material-symbols/svg-400/rounded/menu-fill.svg";
import MoreVert from "@material-symbols/svg-400/rounded/more_vert.svg";
import { useRouter } from "expo-router";
import { type ComponentProps, Suspense } from "react";

import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { z } from "zod/v4";
import { EntryLine, entryDisplayNumber } from "~/components/entries";
import { watchListIcon } from "~/components/items/watchlist-info";
import {
	InfiniteFetch,
	type QueryIdentifier,
	useInfiniteFetch,
	useMutation,
} from "~/data";
import { Entry, Episode, MovieEntry, Season, Special } from "~/models";

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
import { useAccount } from "~/providers/account-context";
import { EmptyView } from "~/ui/empty-view";
import { cn } from "~/utils";

const SeasonItems = ({ serieSlug }: { serieSlug: string }) => {
	const { t } = useTranslation();
	const router = useRouter();
	const { items } = useInfiniteFetch(SeasonHeader.query(serieSlug));

	return items.map((x) => (
		<Menu.Item
			key={x.seasonNumber}
			label={`${x.seasonNumber}: ${
				x.name ?? t("show.season", { number: x.seasonNumber })
			} (${x.entriesCount})`}
			onSelect={() => router.setParams({ season: x.seasonNumber })}
		/>
	));
};

export const SeasonHeader = ({
	serieSlug,
	seasonNumber,
	name,
	className,
	...props
}: {
	serieSlug: string;
	seasonNumber: number;
	name: string | null;
	className?: string;
}) => {
	const { t } = useTranslation();
	const account = useAccount();

	const markAsSeen = useMutation(() => ({
		method: "POST",
		path: ["api", "series", serieSlug, "seasons", `${seasonNumber}`, "history"],
		invalidate: { path: ["api", "series", serieSlug], nested: true },
	}));

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
								onSelect={() => {
									if (markAsSeen.isPending) return;
									markAsSeen.mutate();
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
					<Suspense
						fallback={
							<Menu.Item
								label={t("misc.loading")}
								onSelect={() => {}}
								disabled
							/>
						}
					>
						<SeasonItems serieSlug={serieSlug} />
					</Suspense>
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

SeasonHeader.query = (slug: string): QueryIdentifier<Season> => ({
	schema: Season,
	path: ["api", "series", slug, "seasons"],
	params: {
		// I don't wanna deal with pagination, no series has more than 100 seasons anyways, right?
		limit: 100,
	},
	infinite: true,
});

const EntryOrSeason = Object.assign(
	new Union({ ...Entry.schema, season: Season }, "kind"),
	{
		parser: z.discriminatedUnion("kind", [
			Episode.parser,
			MovieEntry.parser,
			Special.parser,
			Season.parser,
		]),
	},
);
type EntryOrSeason = Entry | Season;

export const EntryList = ({
	slug,
	season,
	currentEntrySlug,
	onSelectVideos,
	onPlay,
	search,
	withContainer,
	stickyHeaderConfig,
	...props
}: {
	slug: string;
	season: string | number;
	currentEntrySlug?: string;
	// play the entry's video in place of navigating to its watch page
	onPlay?: (videoSlug: string) => void;
	onSelectVideos?: (entry: {
		displayNumber: string;
		name: string | null;
		videos: Entry["videos"];
	}) => void;
	search?: string;
	withContainer?: boolean;
} & Partial<ComponentProps<typeof InfiniteFetch<EntryOrSeason>>>) => {
	const { t } = useTranslation();
	const C = withContainer ? Container : View;

	return (
		<InfiniteFetch
			query={EntryList.query(slug, season, search)}
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
						/>
					) : (
						<EntryLine
							{...item}
							href={item.href}
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
							onPress={
								onPlay && item.videos.length
									? (e) => {
											e.preventDefault();
											onPlay(item.videos[0].slug);
										}
									: undefined
							}
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
					<View className="absolute inset-0 mb-4 bg-card web:mb-6" />
				),
			}}
			{...props}
		/>
	);
};

EntryList.query = (
	slug: string,
	season: string | number,
	query: string | undefined,
): QueryIdentifier<EntryOrSeason> => ({
	schema: EntryOrSeason,
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
