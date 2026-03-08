import { View } from "react-native";
import { entryDisplayNumber } from "~/components/entries";
import { Entry, FullVideo } from "~/models";
import { ComboBox, Modal, P, Skeleton } from "~/primitives";
import { InfiniteFetch, type QueryIdentifier } from "~/query";
import { useQueryState } from "~/utils";

export const VideosModal = () => {
	const [slug] = useQueryState<string>("slug", undefined!);

	return (
		<Modal title="toto" scroll={false}>
			<InfiniteFetch
				query={VideosModal.query(slug)}
				layout={{ layout: "vertical", gap: 8, numColumns: 1, size: 48 }}
				Render={({ item }) => (
					<View className="h-12 flex-row items-center justify-between hover:bg-card">
						<P>{item.path}</P>
						<ComboBox
							label={"toto"}
							value={null}
							// value={item.entries.map((x) => entryDisplayNumber(x)).join(", ")}
							query={(q) => ({
								parser: Entry,
								path: ["api", "series", slug, "entries"],
								params: {
									query: q,
								},
								infinite: true,
							})}
							getLabel={(x) => `${entryDisplayNumber(x)} - ${x.name}`}
							onValueChange={(x) => {}}
							getKey={(x) => x.id}
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
