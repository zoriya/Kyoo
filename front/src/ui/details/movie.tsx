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
		<ScrollView>
			<Header kind="movie" slug={slug} />
		</ScrollView>
	);
};
