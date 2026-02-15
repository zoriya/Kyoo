import { useTranslation } from "react-i18next";
import { ItemGrid, itemMap } from "~/components/items";
import { type Genre, Show } from "~/models";
import { H3 } from "~/primitives";
import { InfiniteFetch, type QueryIdentifier } from "~/query";
import { EmptyView } from "~/ui/empty-view";

export const Header = ({ title }: { title: string }) => {
	return <H3 className="m-2 flex-row justify-between px-1">{title}</H3>;
};

export const GenreGrid = ({ genre }: { genre: Genre }) => {
	const { t } = useTranslation();

	return (
		<>
			<Header title={t(`genres.${genre}`)} />
			<InfiniteFetch
				query={GenreGrid.query(genre)}
				layout={{ ...ItemGrid.layout, layout: "horizontal" }}
				Empty={<EmptyView message={t("home.none")} />}
				Render={({ item }) => <ItemGrid {...itemMap(item)} horizontal />}
				Loader={() => <ItemGrid.Loader horizontal />}
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
