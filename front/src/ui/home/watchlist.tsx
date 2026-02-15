import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { EntryBox, entryDisplayNumber } from "~/components/entries";
import { ItemGrid, itemMap } from "~/components/items";
import { Show } from "~/models";
import { Button, Link, P } from "~/primitives";
import { useAccount } from "~/providers/account-context";
import { InfiniteFetch, type QueryIdentifier } from "~/query";
import { EmptyView } from "~/ui/empty-view";
import { Header } from "./genre";

export const WatchlistList = () => {
	const { t } = useTranslation();
	const account = useAccount();

	if (!account) {
		return (
			<>
				<Header title={t("home.watchlist")} />
				<View className="items-center justify-center">
					<P>{t("home.watchlistLogin")}</P>
					<Button
						as={Link}
						href={"/login"}
						text={t("login.login")}
						className="m-4 min-w-md"
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
								kind={entry.kind}
								slug={entry.slug}
								serieSlug={item.slug}
								name={`${item.name} ${entryDisplayNumber(entry)}`}
								description={entry.name}
								thumbnail={entry.thumbnail ?? item.thumbnail}
								href={entry.href ?? "#"}
								watchedPercent={entry.progress.percent}
							/>
						);
					}
					return <ItemGrid {...itemMap(item)} horizontal />;
				}}
				Loader={({ index }) =>
					index % 2 ? <EntryBox.Loader /> : <ItemGrid.Loader horizontal />
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
