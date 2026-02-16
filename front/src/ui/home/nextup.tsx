import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { EntryBox, entryDisplayNumber } from "~/components/entries";
import { ItemGrid } from "~/components/items";
import { Entry } from "~/models";
import { Button, Link, P } from "~/primitives";
import { useAccount } from "~/providers/account-context";
import { InfiniteFetch, type QueryIdentifier } from "~/query";
import { EmptyView } from "~/ui/empty-view";
import { Header } from "./genre";

export const NextupList = () => {
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
				query={NextupList.query()}
				layout={{ ...ItemGrid.layout, layout: "horizontal" }}
				Empty={<EmptyView message={t("home.none")} />}
				Render={({ item }) => (
					<EntryBox
						kind={item.kind}
						slug={item.slug}
						serieSlug={item.show!.slug}
						name={`${item.show!.name} ${entryDisplayNumber(item)}`}
						description={item.name}
						thumbnail={item.thumbnail ?? item.show!.thumbnail}
						href={item.href ?? "#"}
						watchedPercent={item.progress.percent}
					/>
				)}
				Loader={EntryBox.Loader}
			/>
		</>
	);
};

NextupList.query = (): QueryIdentifier<Entry> => ({
	parser: Entry,
	infinite: true,
	path: ["api", "profiles", "me", "nextup"],
	params: {
		limit: 10,
		with: ["nextEntry"],
	},
});
