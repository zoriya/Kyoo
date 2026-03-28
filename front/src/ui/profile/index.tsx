import Bookmark from "@material-symbols/svg-400/rounded/bookmark-fill.svg";
import Cancel from "@material-symbols/svg-400/rounded/cancel-fill.svg";
import CheckCircle from "@material-symbols/svg-400/rounded/check_circle-fill.svg";
import Replay from "@material-symbols/svg-400/rounded/replay.svg";
import Clock from "@material-symbols/svg-400/rounded/schedule-fill.svg";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { EntryBox, entryDisplayNumber } from "~/components/entries";
import { ItemGrid, itemMap } from "~/components/items";
import { Entry, Show, type User, User as UserModel } from "~/models";
import { Avatar, H1, H3, P, Tabs } from "~/primitives";
import { Fetch, InfiniteFetch, type QueryIdentifier } from "~/query";
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
				<InfiniteFetch
					query={ProfilePage.historyQuery(slug)}
					layout={{ ...EntryBox.layout, layout: "horizontal" }}
					Empty={<EmptyView message={t("home.none")} />}
					Render={({ item }) => (
						<EntryBox
							kind={item.kind}
							slug={item.slug}
							serieSlug={item.show?.slug ?? null}
							name={
								item.show
									? `${item.show.name} ${entryDisplayNumber(item)}`
									: item.name
							}
							description={item.name}
							thumbnail={item.thumbnail ?? item.show?.thumbnail ?? null}
							href={item.href ?? "#"}
							watchedPercent={item.progress.percent}
							videos={item.videos}
							onSelectVideos={() => {}}
						/>
					)}
					Loader={EntryBox.Loader}
				/>
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
					className="shrink self-start"
				/>
			</View>
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

	return (
		<InfiniteFetch
			query={ProfilePage.watchlistQuery(slug, status)}
			layout={ItemGrid.layout}
			Header={
				<ProfileHeader slug={slug} status={status} setStatus={setStatus} />
			}
			Render={({ item }) => <ItemGrid {...itemMap(item)} />}
			Loader={() => <ItemGrid.Loader />}
			Empty={<EmptyView message={t("home.none")} className="py-8" />}
		/>
	);
};

ProfilePage.watchlistQuery = (
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

ProfilePage.historyQuery = (slug: string): QueryIdentifier<Entry> => ({
	parser: Entry,
	infinite: true,
	path: ["api", "profiles", slug, "history"],
	params: {
		with: ["show"],
	},
});

ProfilePage.userQuery = (slug: string): QueryIdentifier<User> => ({
	parser: UserModel,
	path: ["auth", "users", slug],
});
