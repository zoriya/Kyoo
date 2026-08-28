import type { LegendListRef } from "@legendapp/list/react-native";
import { useRef, useState } from "react";
import { View, type ViewProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { itemMap } from "~/components/items";
import { ItemDetails } from "~/components/items/item-details";
import { Show } from "~/models";
import { preferFocus } from "~/primitives";
import { InfiniteFetch, type QueryIdentifier } from "~/query";
import { useQueryState } from "~/utils";
import { HeaderBackground, useScrollNavbar } from "../navbar";
import { Header } from "./header";
import { SvgWave } from "./serie";

const CollectionHeader = ({
	slug,
	onImageLayout,
	onSelected,
}: {
	slug: string;
	onImageLayout?: ViewProps["onLayout"];
	onSelected?: () => void;
}) => {
	return (
		<View className="bg-background">
			<Header
				kind="collection"
				slug={slug}
				onImageLayout={onImageLayout}
				onSelected={onSelected}
			/>
			<SvgWave className="flex-1 shrink-0 fill-card" />
		</View>
	);
};

export const CollectionDetails = () => {
	const [slug] = useQueryState("slug", undefined!);
	const insets = useSafeAreaInsets();
	const [imageHeight, setHeight] = useState(300);
	const list = useRef<LegendListRef>(null);
	const { scrollHandler, headerProps } = useScrollNavbar({
		imageHeight,
	});
	return (
		<View className="flex-1 bg-card">
			<HeaderBackground {...headerProps} />
			<InfiniteFetch
				ref={list}
				query={CollectionDetails.query(slug)}
				layout={ItemDetails.layout}
				Render={({ item, index }) => (
					<ItemDetails
						{...itemMap(item)}
						{...preferFocus(index === 0)}
						tagline={item.tagline}
						description={item.description}
						genres={item.genres}
						playHref={item.kind !== "collection" ? item.playHref : null}
						videoSlug={
							item.kind === "movie" && item.videos?.length === 1
								? item.videos[0].slug
								: null
						}
					/>
				)}
				Loader={() => <ItemDetails.Loader />}
				Header={() => (
					<CollectionHeader
						slug={slug}
						onImageLayout={(e) => setHeight(e.nativeEvent.layout.height)}
						// the header is the top of the page, so that is where the page
						// belongs once the remote is on it.
						onSelected={() =>
							list.current?.scrollToOffset({ offset: 0, animated: false })
						}
					/>
				)}
				onScroll={scrollHandler}
				contentContainerStyle={{
					paddingBottom: insets.bottom,
				}}
			/>
		</View>
	);
};

CollectionDetails.query = (slug: string): QueryIdentifier<Show> => ({
	parser: Show,
	path: ["api", "collections", slug, "shows"],
	params: {
		sort: ["airDate"],
	},
	infinite: true,
});
