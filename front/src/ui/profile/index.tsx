import Bookmark from "@material-symbols/svg-400/rounded/bookmark-fill.svg";
import Cancel from "@material-symbols/svg-400/rounded/cancel-fill.svg";
import CheckCircle from "@material-symbols/svg-400/rounded/check_circle-fill.svg";
import Replay from "@material-symbols/svg-400/rounded/replay.svg";
import Clock from "@material-symbols/svg-400/rounded/schedule-fill.svg";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { EntryBox, entryDisplayNumber } from "~/components/entries";
import {
	EntrySelect,
	type EntrySelectEntry,
} from "~/components/entries/select";
import { ItemGrid, itemMap } from "~/components/items";
import type { User } from "~/models";
import { User as UserModel } from "~/models";
import { Avatar, H1, H3, P, Tabs } from "~/primitives";
import {
	eq,
	inArray,
	type InitialQueryBuilder,
	isNull,
	not,
} from "@tanstack/react-db";
import { entries, showWatchStatus, shows } from "~/db";
import { Entry, Show, WatchStatusV } from "~/models";
import {
	Fetch,
	InfiniteFetch,
	InfiniteList,
	type QueryIdentifier,
} from "~/query";
import { EmptyView } from "~/ui/empty-view";
import { useQueryState } from "~/utils";

const statusTabs = [
	{
		value: "all",
		icon: Bookmark,
		translation: "profile.statuses.all",
	},
	{
		value: "completed",
		icon: CheckCircle,
		translation: "profile.statuses.completed",
	},
	{
		value: "watching",
		icon: Clock,
		translation: "profile.statuses.watching",
	},
	{
		value: "rewatching",
		icon: Replay,
		translation: "profile.statuses.rewatching",
	},
	{
		value: "dropped",
		icon: Cancel,
		translation: "profile.statuses.dropped",
	},
	{
		value: "planned",
		icon: Bookmark,
		translation: "profile.statuses.planned",
	},
] as const;

type WatchlistFilter = (typeof statusTabs)[number]["value"];

const renderHistory = (
	entry: Pick<
		Entry,
		"kind" | "slug" | "name" | "thumbnail" | "href" | "progress" | "videos"
	> &
		Parameters<typeof entryDisplayNumber>[0],
	show: Pick<Show, "slug" | "name" | "thumbnail"> | undefined,
	setSelected: (entry: EntrySelectEntry | null) => void = () => {},
) => (
	<EntryBox
		kind={entry.kind}
		slug={entry.slug}
		serieSlug={show?.slug ?? null}
		name={show ? `${show.name} ${entryDisplayNumber(entry)}` : entry.name}
		description={entry.name}
		thumbnail={entry.thumbnail ?? show?.thumbnail ?? null}
		href={entry.href}
		watchedPercent={entry.progress.percent}
		videos={entry.videos}
		onSelectVideos={() =>
			setSelected({
				displayNumber: entryDisplayNumber(entry),
				name: entry.name,
				videos: entry.videos,
			})
		}
	/>
);

const ProfileHeader = ({
	slug,
	status,
	setStatus,
}: {
	slug: string;
	status: WatchlistFilter;
	setStatus: (value: WatchlistFilter) => void;
}) => {
	const { t } = useTranslation();
	const [selected, setSelected] = useState<EntrySelectEntry | null>(null);

	return (
		<View className="mx-2 my-4 gap-4">
			<Fetch
				query={ProfilePage.userQuery(slug)}
				Render={(user) => (
					<View className="flex-row items-center gap-4 rounded-2xl bg-card p-4">
						<Avatar
							src={user.logo}
							placeholder={user.username}
							className="h-16 w-16"
						/>
						<View className="flex-1">
							<H1 className="text-3xl">{user.username}</H1>
						</View>
					</View>
				)}
				Loader={() => (
					<View className="flex-row items-center gap-4 rounded-2xl bg-card p-4">
						<Avatar.Loader className="h-16 w-16" />
						<View className="flex-1">
							<P>{t("misc.loading")}</P>
						</View>
					</View>
				)}
			/>

			<View>
				<H3 className="mb-2">{t("profile.history")}</H3>
				{slug === "me" ? (
					<InfiniteList
						query={ProfilePage.historyQuery}
						pageSize={10}
						layout={{ ...EntryBox.layout, layout: "horizontal" }}
						getKey={(x) => x.entry.id}
						Empty={<EmptyView message={t("home.none")} />}
						Render={({ item: { entry, show } }) =>
							renderHistory(entry, show, setSelected)
						}
						Loader={EntryBox.Loader}
					/>
				) : (
					// Another user's history is not part of our local db.
					<InfiniteFetch
						query={ProfilePage.historyFetch(slug)}
						layout={{ ...EntryBox.layout, layout: "horizontal" }}
						getKey={(x) => `${x.id}-${x.progress.playedDate?.toISOString()}`}
						Empty={<EmptyView message={t("home.none")} />}
						Render={({ item }) => renderHistory(item, item.show, setSelected)}
						Loader={EntryBox.Loader}
					/>
				)}
			</View>

			<View>
				<H3 className="mb-2">{t("profile.watchlist")}</H3>
				<Tabs
					tabs={statusTabs.map((tab) => ({
						label: t(tab.translation),
						value: tab.value,
						icon: tab.icon,
					}))}
					value={status}
					setValue={setStatus}
					className="self-start"
				/>
			</View>
			<EntrySelect entry={selected} onClose={() => setSelected(null)} />
		</View>
	);
};

export const ProfilePage = () => {
	const [slug] = useQueryState<string>("slug", undefined!);

	return <ProfileScreen slug={slug} />;
};

export const ProfileScreen = ({ slug }: { slug: string }) => {
	const { t } = useTranslation();
	const [status, setStatus] = useQueryState<WatchlistFilter>("status", "all");

	const header = (
		<ProfileHeader slug={slug} status={status} setStatus={setStatus} />
	);
	if (slug !== "me")
		return (
			<InfiniteFetch
				query={ProfilePage.watchlistFetch(slug, status)}
				layout={ItemGrid.layout}
				Header={header}
				Render={({ item }) => <ItemGrid {...itemMap(item)} />}
				Loader={() => <ItemGrid.Loader />}
				Empty={<EmptyView message={t("home.none")} className="py-8" />}
			/>
		);
	return (
		<InfiniteList
			query={(q) => ProfilePage.watchlistQuery(q, status)}
			layout={ItemGrid.layout}
			Header={header}
			Render={({ item }) => <ItemGrid {...itemMap(item)} />}
			Loader={() => <ItemGrid.Loader />}
			Empty={<EmptyView message={t("home.none")} className="py-8" />}
		/>
	);
};

ProfilePage.watchlistQuery = (
	q: InitialQueryBuilder,
	status: WatchlistFilter,
) =>
	q
		.from({ s: shows })
		.where(({ s }) =>
			status === "all"
				? inArray(showWatchStatus(s).status, [...WatchStatusV])
				: eq(showWatchStatus(s).status, status),
		)
		.orderBy(({ s }) => showWatchStatus(s).lastPlayedAt, "desc");

ProfilePage.historyQuery = (q: InitialQueryBuilder) =>
	q
		.from({ e: entries })
		.innerJoin({ s: shows }, ({ e, s }) => eq(e.showId, s.id))
		.where(({ e }) => not(isNull(e.progress.playedDate)))
		.orderBy(({ e }) => e.progress.playedDate, "desc")
		.select(({ e, s }) => ({ entry: e, show: s }));

ProfilePage.watchlistFetch = (
	slug: string,
	status: WatchlistFilter,
): QueryIdentifier<Show> => ({
	parser: Show,
	infinite: true,
	path: ["api", "profiles", slug, "watchlist"],
	params: {
		...(status !== "all" ? { filter: `watchStatus eq ${status}` } : {}),
	},
});

ProfilePage.historyFetch = (slug: string): QueryIdentifier<Entry> => ({
	parser: Entry,
	infinite: true,
	path: ["api", "profiles", slug, "history"],
});

ProfilePage.userQuery = (slug: string): QueryIdentifier<User> => ({
	parser: UserModel,
	path: ["auth", "users", slug],
});
