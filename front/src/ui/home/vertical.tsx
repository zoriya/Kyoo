import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { ItemList, itemMap } from "~/components/items";
import { useLiveQuery } from "@tanstack/react-db";
import { randomOrder, shows } from "~/db";
import { Header } from "./genre";

export const VerticalRecommended = () => {
	const { t } = useTranslation();
	// desc: the other end of the shuffle than the recommended row
	const { data, isReady } = useLiveQuery((q) =>
		q
			.from({ s: shows })
			.orderBy(({ s }) => randomOrder(s.id), "desc")
			.limit(3),
	);
	const items = isReady ? data : undefined;

	return (
		<View>
			<Header title={t("home.recommended")} />
			<View className="mx-2 flex-1 gap-2">
				{items
					? items.map((x) => (
							<ItemList key={x.slug} {...itemMap(x)} scrollSnapAlign="start" />
						))
					: [...Array(3)].map((_, i) => <ItemList.Loader key={i} />)}
			</View>
		</View>
	);
};
