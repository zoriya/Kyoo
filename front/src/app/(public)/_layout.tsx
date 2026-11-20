import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCSSVariable, useResolveClassNames } from "uniwind";
import { NavbarProfile, NavbarTitle } from "~/ui/navbar";

export { LayoutErrorBoundary as ErrorBoundary } from "~/ui/error-boundary";

export default function Layout() {
	const insets = useSafeAreaInsets();
	const accent = useCSSVariable("--color-accent");
	const { color } = useResolveClassNames("text-slate-200");

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
				headerTintColor: color as string,
			}}
		/>
	);
}
