import { Stack } from "expo-router";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCSSVariable, useResolveClassNames } from "uniwind";
import { MiniPlayer, TabBarHeightProvider } from "~/ui/mini-player";
import { NavbarLeft, NavbarRight } from "~/ui/navbar";

export { ErrorBoundary } from "~/ui/error-boundary";

export const unstable_settings = {
	initialRouteName: "(tabs)",
};

export default function Layout() {
	const insets = useSafeAreaInsets();
	const accent = useCSSVariable("--color-accent");
	const { color } = useResolveClassNames("text-slate-200");

	return (
		<TabBarHeightProvider>
			<Stack
				screenOptions={{
					// the tv navigates with the rail and the remote's back button, a header
					// bar would only eat 56px of a screen meant to be watched from a couch.
					headerShown: !Platform.isTV,
					headerTitle: () => <NavbarLeft />,
					headerRight: () => <NavbarRight />,
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
			<MiniPlayer />
		</TabBarHeightProvider>
	);
}
