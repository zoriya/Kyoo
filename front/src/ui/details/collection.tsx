import { useState } from "react";
import { View, type ViewProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { itemMap } from "~/components/items";
import { ItemDetails } from "~/components/items/item-details";
import { Show } from "~/models";
import { InfiniteFetch, type QueryIdentifier } from "~/query";
import { useQueryState } from "~/utils";
import { HeaderBackground, useScrollNavbar } from "../navbar";
import { Header } from "./header";
import { SvgWave } from "./serie";

const CollectionHeader = ({
	slug,
	onImageLayout,
}: {
	slug: string;
	onImageLayout?: ViewProps["onLayout"];
}) => {
	return (
		<View className="bg-background">
			<Header kind="collection" slug={slug} onImageLayout={onImageLayout} />
			<SvgWave className="flex-1 shrink-0 fill-card" />
		</View>
	);
};

export const CollectionDetails = () => {
	const [slug] = useQueryState("slug", undefined!);
	const insets = useSafeAreaInsets();
	const [imageHeight, setHeight] = useState(300);
	const { scrollHandler, headerProps } = useScrollNavbar({
		imageHeight,
	});
	return (
		<View className="flex-1 bg-card">
			<HeaderBackground {...headerProps} />
			<InfiniteFetch
				query={CollectionDetails.query(slug)}
				layout={ItemDetails.layout}
				Render={({ item }) => (
					<ItemDetails
						{...itemMap(item)}
						tagline={item.tagline}
						description={item.description}
						genres={item.genres}
						playHref={item.kind !== "collection" ? item.playHref : null}
					/>
				)}
				Loader={() => <ItemDetails.Loader />}
				Header={() => (
					<CollectionHeader
						slug={slug}
						onImageLayout={(e) => setHeight(e.nativeEvent.layout.height)}
					/>
				)}
				onScroll={scrollHandler}
				contentContainerStyle={{
					paddingBottom: insets.bottom,
				}}
				outerGap
			/>
		</View>
	);
};

CollectionDetails.query = (slug: string): QueryIdentifier<Show> => ({
	parser: Show,
	path: ["api", "collections", slug, "shows"],
	infinite: true,
});
