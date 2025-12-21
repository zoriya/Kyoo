import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useYoshiki } from "yoshiki/native";
import { EntryBox, entryDisplayNumber } from "~/components/entries";
import { ItemGrid } from "~/components/items";
import { Show } from "~/models";
import { Button, Link, P, ts } from "~/primitives";
import { useAccount } from "~/providers/account-context";
import { InfiniteFetch, type QueryIdentifier } from "~/query";
import { getDisplayDate } from "~/utils";
import { EmptyView } from "../errors";
import { Header } from "./genre";

export const WatchlistList = () => {
	const { t } = useTranslation();
	const { css } = useYoshiki();
	const account = useAccount();

	if (!account) {
		return (
			<>
				<Header title={t("home.watchlist")} />
				<View {...css({ justifyContent: "center", alignItems: "center" })}>
					<P>{t("home.watchlistLogin")}</P>
					<Button
						as={Link}
						href={"/login"}
						text={t("login.login")}
						{...css({ minWidth: ts(24), margin: ts(2) })}
					/>
				</View>
			</>
		);
	}

	return (
		<>
			<Header title={t("home.watchlist")} />
			<InfiniteFetch
				query={WatchlistList.query()}
				layout={{ ...ItemGrid.layout, layout: "horizontal" }}
				getItemType={(x, i) =>
					(x?.kind === "serie" && x.nextEntry) || (!x && i % 2)
						? "episode"
						: "item"
				}
				getItemSizeMult={(_, __, kind) => (kind === "episode" ? 2 : 1)}
				Empty={<EmptyView message={t("home.none")} />}
				Render={({ item }) => {
					const entry = item.kind === "serie" ? item.nextEntry : null;
					if (entry) {
						return (
							<EntryBox
								slug={entry.slug}
								serieSlug={item.slug}
								name={`${item.name} ${entryDisplayNumber(entry)}`}
								description={entry.name}
								thumbnail={entry.thumbnail ?? item.thumbnail}
								href={entry.href ?? "#"}
								watchedPercent={entry.watchStatus?.percent || null}
							/>
						);
					}
					return (
						<ItemGrid
							href={item.href}
							slug={item.slug}
							kind={item.kind}
							name={item.name!}
							subtitle={getDisplayDate(item)}
							poster={item.poster}
							watchStatus={
								item.kind !== "collection"
									? (item.watchStatus?.status ?? null)
									: null
							}
							watchPercent={
								item.kind === "movie" && item.watchStatus
									? item.watchStatus.percent
									: null
							}
							unseenEpisodesCount={null}
						/>
					);
				}}
				Loader={({ index }) =>
					index % 2 ? <EntryBox.Loader /> : <ItemGrid.Loader />
				}
			/>
		</>
	);
};

WatchlistList.query = (): QueryIdentifier<Show> => ({
	parser: Show,
	infinite: true,
	path: ["api", "profiles", "me", "watchlist"],
	params: {
		limit: 10,
		with: ["nextEntry"],
	},
});
