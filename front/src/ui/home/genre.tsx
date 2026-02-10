import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useYoshiki } from "yoshiki/native";
import { ItemGrid, itemMap } from "~/components/items";
import { type Genre, Show } from "~/models";
import { H3, ts } from "~/primitives";
import { InfiniteFetch, type QueryIdentifier } from "~/query";
import { EmptyView } from "~/ui/empty-view";

export const Header = ({ title }: { title: string }) => {
	const { css } = useYoshiki();

	return (
		<View
			{...css({
				marginTop: ItemGrid.layout.gap,
				marginX: ItemGrid.layout.gap,
				pX: ts(0.5),
				flexDirection: "row",
				justifyContent: "space-between",
			})}
		>
			<H3>{title}</H3>
		</View>
	);
};

export const GenreGrid = ({ genre }: { genre: Genre }) => {
	const { t } = useTranslation();

	return (
		<>
			<Header title={t(`genres.${genre}`)} />
			<InfiniteFetch
				query={GenreGrid.query(genre)}
				layout={{ ...ItemGrid.layout, layout: "horizontal" }}
				placeholderCount={2}
				Empty={<EmptyView message={t("home.none")} />}
				Render={({ item }) => <ItemGrid {...itemMap(item)} horizontal />}
				Loader={ItemGrid.Loader}
			/>
		</>
	);
};

GenreGrid.query = (genre: Genre): QueryIdentifier<Show> => ({
	parser: Show,
	infinite: true,
	path: ["api", "shows"],
	params: {
		filter: `genres has ${genre}`,
		sort: "random",
		// Limit the initial numbers of items
		limit: 10,
	},
});
