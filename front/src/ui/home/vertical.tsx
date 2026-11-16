import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { ItemList, itemMap } from "~/components/items";
import { type QueryIdentifier, useInfiniteFetch } from "~/data";
import { Show } from "~/models";
import { useSetting } from "~/ui/settings/base";
import { Header } from "./genre";

export const VerticalRecommended = () => {
	const { t } = useTranslation();
	const { items } = useInfiniteFetch(VerticalRecommended.query());
	const [preferOriginal] = useSetting("preferOriginal", "non-logo");

	return (
		<View>
			<Header title={t("home.recommended")} />
			<View className="mx-2 flex-1 gap-2">
				{items
					? items.map((x) => (
							<ItemList
								key={x.slug}
								{...itemMap(x, preferOriginal)}
								scrollSnapAlign="start"
							/>
						))
					: [...Array(3)].map((_, i) => <ItemList.Loader key={i} />)}
			</View>
		</View>
	);
};

VerticalRecommended.query = (): QueryIdentifier<Show> => ({
	schema: Show,
	infinite: true,
	path: ["api", "shows"],
	params: {
		sort: "random",
		limit: 3,
	},
});
