import { getFocusedRouteNameFromRoute } from "@react-navigation/native";
import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCSSVariable, useResolveClassNames } from "uniwind";
import { NavbarRight, NavbarTitle } from "~/ui/navbar";

export { ErrorBoundary } from "~/ui/error-bondary";

export default function Layout() {
	const insets = useSafeAreaInsets();
	const accent = useCSSVariable("--color-accent");
	const { color } = useResolveClassNames("text-slate-200");

	return (
		<Stack
			screenOptions={{
				headerTitle: () => <NavbarTitle />,
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
		>
			<Stack.Screen
				name="(tabs)"
				options={({ route }) => {
					if (getFocusedRouteNameFromRoute(route) === "index") {
						return {
							headerTransparent: true,
							headerStyle: { backgroundColor: undefined },
						};
					}
					return {};
				}}
			/>
			<Stack.Screen
				name="info/[slug]"
				options={{
					presentation: "modal",
				}}
			/>
		</Stack>
	);
}
