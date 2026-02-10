import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCSSVariable } from "uniwind";
import { NavbarProfile, NavbarTitle } from "~/ui/navbar";

export { ErrorBoundary } from "~/ui/error-bondary";

export default function Layout() {
	const insets = useSafeAreaInsets();
	const accent = useCSSVariable("--color-accent");

	return (
		<Stack
			screenOptions={{
				headerTitle: () => <NavbarTitle />,
				headerRight: () => <NavbarProfile />,
				contentStyle: {
					paddingLeft: insets.left,
					paddingRight: insets.right,
				},
				headerStyle: {
					backgroundColor: accent as string,
				},
			}}
		/>
	);
}
