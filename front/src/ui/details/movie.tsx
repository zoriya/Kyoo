import { ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryState } from "~/utils";
import { Header } from "./header";

export const MovieDetails = () => {
	const [slug] = useQueryState("slug", undefined!);
	const insets = useSafeAreaInsets();

	return (
		<ScrollView contentContainerStyle={{ paddingBottom: insets.bottom }}>
			<Header kind="movie" slug={slug} />
		</ScrollView>
	);
};
