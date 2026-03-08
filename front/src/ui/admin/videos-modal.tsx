import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { entryDisplayNumber } from "~/components/entries";
import { Entry, FullVideo } from "~/models";
import { ComboBox, Modal, P, Skeleton } from "~/primitives";
import { InfiniteFetch, type QueryIdentifier, useFetch } from "~/query";
import { useQueryState } from "~/utils";
import { Header } from "../details/header";

export const VideosModal = () => {
	const [slug] = useQueryState<string>("slug", undefined!);
	const { data } = useFetch(Header.query("serie", slug));
	const { t } = useTranslation();

	return (
		<Modal title={data?.name ?? t("misc.loading")} scroll={false}>
			<InfiniteFetch
				query={VideosModal.query(slug)}
				layout={{ layout: "vertical", gap: 8, numColumns: 1, size: 48 }}
				Render={({ item }) => (
					<View className="h-12 flex-row items-center justify-between hover:bg-card">
						<P>{item.path}</P>
						<ComboBox
							multiple
							label={t("show.videos-map-none")}
							searchPlaceholder={t("navbar.search")}
							values={item.entries}
							query={(q) => ({
								parser: Entry,
								path: ["api", "series", slug, "entries"],
								params: {
									query: q,
								},
								infinite: true,
							})}
							getKey={(x) => x.id}
							getLabel={(x) => `${entryDisplayNumber(x)} - ${x.name}`}
							getSmallLabel={entryDisplayNumber}
							onValueChange={(x) => {}}
						/>
					</View>
				)}
				Loader={() => <Skeleton />}
			/>
		</Modal>
	);
};

VideosModal.query = (slug: string): QueryIdentifier<FullVideo> => ({
	parser: FullVideo,
	path: ["api", "series", slug, "videos"],
	infinite: true,
});
