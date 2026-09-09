import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { ItemDetails } from "~/components/items/item-details";
import { useBreakpointMap } from "~/primitives";
import { coalesce, eq, useLiveQuery } from "@tanstack/react-db";
import { entries, randomOrder, shows } from "~/db";
import { getDisplayDate } from "~/utils";
import { Header } from "./genre";

const itemCount = 6;

export const Recommended = () => {
	const { t } = useTranslation();
	const { numColumns, gap } = useBreakpointMap(ItemDetails.layout);
	const { data, isReady } = useLiveQuery((q) =>
		q
			.from({ s: shows })
			.leftJoin({ fe: entries }, ({ s, fe }) => eq(s.firstEntryId, fe.id))
			.leftJoin({ ne: entries }, ({ s, ne }) => eq(s.nextEntryId, ne.id))
			.orderBy(({ s }) => randomOrder(s.id))
			.select(({ s, fe, ne }) => ({
				show: s,
				playHref: coalesce(ne.href, fe.href),
			}))
			.limit(itemCount),
	);
	const items = isReady ? data : undefined;

	return (
		<View>
			<Header title={t("home.recommended")} />
			<View className="flex-1 flex-row" style={{ gap, margin: gap }}>
				{[...Array(numColumns)].map((_, x) => (
					<View key={x} className="flex-1" style={{ gap }}>
						{[...Array(itemCount / numColumns)].map((_, y) => {
							if (!items) return <ItemDetails.Loader key={y} />;
							const row = items[x * (itemCount / numColumns) + y];
							if (!row) return <ItemDetails.Loader key={y} />;
							const item = row.show;
							if (!item) return null;
							return (
								<ItemDetails
									key={y}
									scrollSnapAlign="start"
									slug={item.slug}
									kind={item.kind}
									name={item.name}
									tagline={
										item.kind !== "collection" && "tagline" in item
											? item.tagline
											: null
									}
									description={item.description}
									poster={item.poster}
									subtitle={
										item.kind !== "collection" ? getDisplayDate(item) : null
									}
									genres={
										item.kind !== "collection" && "genres" in item
											? item.genres
											: null
									}
									href={item.href}
									playHref={
										item.kind !== "collection" ? (row.playHref ?? null) : null
									}
									watchStatus={
										(item.kind !== "collection" && item.watchStatus?.status) ||
										null
									}
									availableCount={
										item.kind === "serie" ? item.availableCount : null
									}
									seenCount={
										item.kind === "serie" ? item.watchStatus?.seenCount : null
									}
									videoSlug={
										item.kind === "movie" && item.videos?.length === 1
											? item.videos[0].slug
											: null
									}
								/>
							);
						})}
					</View>
				))}
			</View>
		</View>
	);
};
