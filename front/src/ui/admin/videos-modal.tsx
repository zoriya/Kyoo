import { View } from "react-native";
import { entryDisplayNumber } from "~/components/entries";
import { FullVideo } from "~/models";
import { Modal, P, Select, Skeleton } from "~/primitives";
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
						<Select
							label={"toto"}
							value={1}
							values={[1, 2, 3]}
							getLabel={() =>
								item.entries.map((x) => entryDisplayNumber(x)).join(", ")
							}
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
