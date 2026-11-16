import { useState } from "react";
import { useTranslation } from "react-i18next";
import { EntryBox, entryDisplayNumber } from "~/components/entries";
import {
	EntrySelect,
	type EntrySelectEntry,
} from "~/components/entries/select";
import { InfiniteFetch, type QueryIdentifier } from "~/data";
import { Entry } from "~/models";
import { showImages } from "~/models/utils/images";
import { EmptyView } from "~/ui/empty-view";
import { useSetting } from "~/ui/settings/base";
import { Header } from "./genre";

export const NewsList = () => {
	const { t } = useTranslation();
	const [preferOriginal] = useSetting("preferOriginal", "always");
	const [selected, setSelected] = useState<EntrySelectEntry | null>(null);

	return (
		<>
			<Header title={t("home.news")}>
				<InfiniteFetch
					extraData={preferOriginal}
					query={NewsList.query()}
					layout={{ ...EntryBox.layout, layout: "horizontal" }}
					Empty={<EmptyView message={t("home.none")} className="py-6" />}
					Render={({ item }) => (
						<EntryBox
							id={item.id}
							kind={item.kind}
							slug={item.slug}
							serieSlug={item.show!.slug}
							name={`${item.show!.name} ${entryDisplayNumber(item)}`}
							description={item.name}
							thumbnail={
								item.thumbnail ??
								showImages(item.show!, preferOriginal).thumbnail
							}
							href={item.href}
							watchedPercent={item.progress?.percent ?? 0}
							videos={item.videos}
							onSelectVideos={() =>
								setSelected({
									displayNumber: entryDisplayNumber(item),
									name: item.name,
									videos: item.videos,
								})
							}
						/>
					)}
					Loader={EntryBox.Loader}
				/>
			</Header>
			<EntrySelect entry={selected} onClose={() => setSelected(null)} />
		</>
	);
};

NewsList.query = (): QueryIdentifier<Entry> => ({
	schema: Entry,
	infinite: true,
	path: ["api", "news"],
	params: {
		limit: 10,
	},
});
