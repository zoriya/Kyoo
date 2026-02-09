import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useYoshiki } from "yoshiki/native";
import { ItemGrid } from "~/components/items";
import { ItemDetails } from "~/components/items/item-details";
import { Show } from "~/models";
import { H3 } from "~/primitives";
import { InfiniteFetch, type QueryIdentifier } from "~/query";
import { getDisplayDate } from "~/utils";

export const Recommended = () => {
	const { t } = useTranslation();
	const { css } = useYoshiki();

	return (
		<View
			{...css({ marginX: ItemGrid.layout.gap, marginTop: ItemGrid.layout.gap })}
		>
			<H3 className="px-1">{t("home.recommended")}</H3>
			<InfiniteFetch
				query={Recommended.query()}
				layout={ItemDetails.layout}
				placeholderCount={6}
				fetchMore={false}
				contentContainerStyle={{ marginHorizontal: 0 }}
				Render={({ item }) => (
					<ItemDetails
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
						subtitle={item.kind !== "collection" ? getDisplayDate(item) : null}
						genres={
							item.kind !== "collection" && "genres" in item
								? item.genres
								: null
						}
						href={item.href}
						playHref={item.kind !== "collection" ? item.playHref : null}
						watchStatus={
							(item.kind !== "collection" && item.watchStatus?.status) || null
						}
						availableCount={item.kind === "serie" ? item.availableCount : null}
						seenCount={
							item.kind === "serie" ? item.watchStatus?.seenCount : null
						}
					/>
				)}
				Loader={ItemDetails.Loader}
			/>
		</View>
	);
};

Recommended.query = (): QueryIdentifier<Show> => ({
	parser: Show,
	infinite: true,
	path: ["api", "shows"],
	params: {
		sort: "random",
		limit: 6,
		with: ["firstEntry"],
	},
});
