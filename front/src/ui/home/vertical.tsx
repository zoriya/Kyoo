import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useYoshiki } from "yoshiki/native";
import { ItemGrid, ItemList, itemMap } from "~/components/items";
import { Show } from "~/models";
import { H3 } from "~/primitives";
import { InfiniteFetch, type QueryIdentifier } from "~/query";

export const VerticalRecommended = () => {
	const { t } = useTranslation();
	const { css } = useYoshiki();

	return (
		<View {...css({ marginY: ItemGrid.layout.gap })}>
			<H3 {...css({ mX: ItemGrid.layout.gap })}>{t("home.recommended")}</H3>
			<InfiniteFetch
				query={VerticalRecommended.query()}
				placeholderCount={3}
				layout={{ ...ItemList.layout, layout: "vertical" }}
				fetchMore={false}
				Render={({ item }) => <ItemList {...itemMap(item)} />}
				Loader={() => <ItemList.Loader />}
			/>
		</View>
	);
};

VerticalRecommended.query = (): QueryIdentifier<Show> => ({
	parser: Show,
	infinite: true,
	path: ["api", "shows"],
	params: {
		sort: "random",
		limit: 3,
	},
});
