import { getFocusedRouteNameFromRoute } from "@react-navigation/native";
import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCSSVariable, useResolveClassNames } from "uniwind";
import { ErrorConsumer } from "~/providers/error-consumer";
import { NavbarRight, NavbarTitle } from "~/ui/navbar";

export default function Layout() {
	const insets = useSafeAreaInsets();
	const accent = useCSSVariable("--color-accent");
	const { color } = useResolveClassNames("text-slate-200");

	return (
		<ErrorConsumer scope="app">
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
		</ErrorConsumer>
	);
}
