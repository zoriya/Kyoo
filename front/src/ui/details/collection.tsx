import { useState } from "react";
import { Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { itemMap } from "~/components/items";
import { ItemDetails } from "~/components/items/item-details";
import { Show } from "~/models";
import { FocusGroup, rem } from "~/primitives";
import { InfiniteFetch, type QueryIdentifier } from "~/query";
import { useQueryState } from "~/utils";
import { useHeroHeight } from "../hero";
import { HeaderBackground, useScrollNavbar } from "../navbar";
import { Header } from "./header";
import { SvgWave } from "./serie";
import { InfoShelf } from "./shelf";

const sidePadding = Platform.isTV ? rem(32) : rem(4);

const CollectionHeader = ({
	slug,
	openInfo,
}: {
	slug: string;
	openInfo?: () => void;
}) => {
	return (
		<View className="bg-background" style={{ marginHorizontal: -sidePadding }}>
			<Header kind="collection" slug={slug} openInfo={openInfo} />
			<SvgWave className="flex-1 shrink-0 fill-card" />
			{/* the gap between the wave and the first show */}
			<View className="h-4 bg-card" />
		</View>
	);
};

export const CollectionDetails = () => {
	const [slug] = useQueryState("slug", undefined!);
	const insets = useSafeAreaInsets();
	const { scrollHandler, headerProps } = useScrollNavbar({
		imageHeight: useHeroHeight(),
	});
	const [info, setInfo] = useState(false);

	return (
		<View className="flex-1 bg-card">
			<HeaderBackground {...headerProps} />
			<FocusGroup autoFocus focusable={!info} className="flex-1">
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
							openInfo={Platform.isTV ? () => setInfo(true) : undefined}
						/>
					)}
					onScroll={scrollHandler}
					scrollEventThrottle={16}
					snapToAlignment="item"
					contentContainerStyle={{
						paddingHorizontal: sidePadding,
						paddingBottom: insets.bottom + rem(8),
					}}
				/>
			</FocusGroup>
			{Platform.isTV && (
				<InfoShelf
					kind="collection"
					slug={slug}
					isOpen={info}
					close={() => setInfo(false)}
				/>
			)}
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
