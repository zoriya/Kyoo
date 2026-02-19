import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { ItemDetails } from "~/components/items/item-details";
import { Show } from "~/models";
import { useBreakpointMap } from "~/primitives";
import { type QueryIdentifier, useInfiniteFetch } from "~/query";
import { getDisplayDate } from "~/utils";
import { Header } from "./genre";

const itemCount = 6;

export const Recommended = () => {
	const { t } = useTranslation();
	const { numColumns, gap } = useBreakpointMap(ItemDetails.layout);
	const { items } = useInfiniteFetch(Recommended.query());

	return (
		<View>
			<Header title={t("home.recommended")} />
			<View className="flex-1 flex-row" style={{ gap, margin: gap }}>
				{[...Array(numColumns)].map((_, x) => (
					<View key={x} className="flex-1" style={{ gap }}>
						{[...Array(itemCount / numColumns)].map((_, y) => {
							if (!items) return <ItemDetails.Loader key={y} />;
							const item = items[x * (itemCount / numColumns) + y];
							return (
								<ItemDetails
									key={y}
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
									playHref={item.kind !== "collection" ? item.playHref : null}
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
								/>
							);
						})}
					</View>
				))}
			</View>
		</View>
	);
};

Recommended.query = (): QueryIdentifier<Show> => ({
	parser: Show,
	infinite: true,
	path: ["api", "shows"],
	params: {
		sort: "random",
		limit: itemCount,
		with: ["firstEntry"],
	},
});
