import { useState } from "react";
import { Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { itemMap } from "~/components/items";
import { ItemDetails } from "~/components/items/item-details";
import { FocusGroup, rem } from "~/primitives";
import { coalesce, eq } from "@tanstack/react-db";
import { entries, shows } from "~/db";
import { InfiniteList } from "~/query";
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
				<InfiniteList
					query={(q) =>
						q
							.from({ s: shows })
							.leftJoin({ fe: entries }, ({ s, fe }) =>
								eq(s.firstEntryId, fe.id),
							)
							.leftJoin({ ne: entries }, ({ s, ne }) =>
								eq(s.nextEntryId, ne.id),
							)
							.where(({ s }) => eq(s.collectionSlug, slug))
							.orderBy(({ s }) => s.startAir)
							.select(({ s, fe, ne }) => ({
								show: s,
								playHref: coalesce(ne.href, fe.href),
							}))
					}
					getKey={(x) => x.show.id}
					layout={ItemDetails.layout}
					Render={({ item: { show, playHref } }) => (
						<ItemDetails
							{...itemMap(show)}
							tagline={show.tagline}
							description={show.description}
							genres={show.genres}
							playHref={show.kind !== "collection" ? (playHref ?? null) : null}
							videoSlug={
								show.kind === "movie" && show.videos?.length === 1
									? show.videos[0].slug
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
