import { Platform, ScrollView } from "react-native";
import { useYoshiki } from "yoshiki/native";
import { Movie } from "~/models";
import type { QueryIdentifier } from "~/query";
import { useQueryState } from "~/utils";
import { Header } from "./header";

export const MovieDetails = () => {
	const [slug] = useQueryState("slug", undefined!);
	const { css } = useYoshiki();

	return (
		<ScrollView
			//{...css(
			//	Platform.OS === "web" && {
			//		// @ts-ignore Web only property
			//		overflow: "auto" as any,
			//		// @ts-ignore Web only property
			//		overflowX: "hidden",
			//		// @ts-ignore Web only property
			//		overflowY: "overlay",
			//	},
			//)}
		>
			<Header kind="movie" slug={slug} />
			{/* <DetailsCollections type="movie" slug={slug} /> */}
			{/* <Staff slug={slug} /> */}
		</ScrollView>
	);
};
