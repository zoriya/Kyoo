import { Text, View } from "react-native";
import { useYoshiki } from "yoshiki/native";
import { LibraryItem, LibraryItemP, type News, NewsP } from "~/models";
import type { QueryIdentifier } from "~/query/index";

export async function loader() {
	await prefetchQuery(Header.query());
}

export default function Header() {
	const { css } = useYoshiki();

	return (
		<Fetch
			query={NewsList.query()}
			layout={{ ...ItemGrid.layout, layout: "horizontal" }}
			getItemType={(x, i) => (x?.kind === "movie" || (!x && i % 2) ? "movie" : "episode")}
			getItemSize={(kind) => (kind === "episode" ? 2 : 1)}
			empty={t("home.none")}
			Render={({ item }) => {
				<Text>{item.name}</Text>;
			}}
			Loader={({ index }) => (index % 2 ? <EpisodeBox.Loader /> : <ItemGrid.Loader />)}
		/>
	);
}

Header.query = (): QueryIdentifier<LibraryItem> => ({
	parser: LibraryItemP,
	path: ["items", "random"],
	params: {
		fields: ["firstEpisode"],
	},
});
