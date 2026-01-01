import { useTranslation } from "react-i18next";
import { EntryBox, entryDisplayNumber } from "~/components/entries";
import { ItemGrid } from "~/components/items";
import { Entry } from "~/models";
import { InfiniteFetch, type QueryIdentifier } from "~/query";
import { EmptyView } from "../errors";
import { Header } from "./genre";

export const NewsList = () => {
	const { t } = useTranslation();

	return (
		<>
			<Header title={t("home.news")} />
			<InfiniteFetch
				query={NewsList.query()}
				layout={{ ...ItemGrid.layout, layout: "horizontal" }}
				// getItemType={(x, i) =>
				// 	x?.kind === "movie" || (!x && i % 2) ? "movie" : "episode"
				// }
				// getItemSizeMult={(_, __, kind) => (kind === "episode" ? 2 : 1)}
				Empty={<EmptyView message={t("home.none")} />}
				Render={({ item }) => {
					// if (item.kind === "episode" || item.kind === "special") {
					return (
						<EntryBox
							slug={item.slug}
							serieSlug={item.slug}
							name={`${item.name} ${entryDisplayNumber(item)}`}
							description={item.name}
							thumbnail={item.thumbnail}
							href={item.href ?? "#"}
							watchedPercent={item.watchStatus?.percent || null}
						/>
					);
					// 	}
					// 	return (
					// 		<ItemGrid
					// 			href={item.href ?? "#"}
					// 			slug={item.slug}
					// 			kind={"movie"}
					// 			name={item.name!}
					// 			subtitle={
					// 				item.airDate
					// 					? new Date(item.airDate).getFullYear().toString()
					// 					: null
					// 			}
					// 			poster={item.kind === "movie" ? item.poster : null}
					// 			watchStatus={item.watchStatus?.status || null}
					// 			watchPercent={item.watchStatus?.percent || null}
					// 			unseenEpisodesCount={null}
					// 		/>
					// 	);
				}}
				Loader={({ index }) =>
					index % 2 ? <EntryBox.Loader /> : <ItemGrid.Loader />
				}
			/>
		</>
	);
};

NewsList.query = (): QueryIdentifier<Entry> => ({
	parser: Entry,
	infinite: true,
	path: ["api", "news"],
	params: {
		limit: 10,
	},
});
