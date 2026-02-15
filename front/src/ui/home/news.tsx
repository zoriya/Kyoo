import { useTranslation } from "react-i18next";
import { EntryBox, entryDisplayNumber } from "~/components/entries";
import { Entry } from "~/models";
import { InfiniteFetch, type QueryIdentifier } from "~/query";
import { EmptyView } from "~/ui/empty-view";
import { Header } from "./genre";

export const NewsList = () => {
	const { t } = useTranslation();

	return (
		<>
			<Header title={t("home.news")} />
			<InfiniteFetch
				query={NewsList.query()}
				layout={{ ...EntryBox.layout, layout: "horizontal" }}
				Empty={<EmptyView message={t("home.none")} />}
				Render={({ item }) => {
					return (
						<EntryBox
							kind={item.kind}
							slug={item.slug}
							serieSlug={item.show!.slug}
							name={`${item.show!.name} ${entryDisplayNumber(item)}`}
							description={item.name}
							thumbnail={item.thumbnail}
							href={item.href ?? "#"}
							watchedPercent={item.progress.percent}
						/>
					);
				}}
				Loader={EntryBox.Loader}
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
