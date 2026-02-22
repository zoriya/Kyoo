import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCSSVariable, useResolveClassNames } from "uniwind";
import { NavbarLeft, NavbarRight } from "~/ui/navbar";

export { ErrorBoundary } from "~/ui/error-bondary";

export const unstable_settings = {
	initialRouteName: "(tabs)",
};

export default function Layout() {
	const insets = useSafeAreaInsets();
	const accent = useCSSVariable("--color-accent");
	const { color } = useResolveClassNames("text-slate-200");

	return (
		<Stack
			screenOptions={{
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
		>
			<Stack.Screen
				name="info/[slug]"
				options={{
					presentation: "transparentModal",
					headerShown: false,
					contentStyle: {
						backgroundColor: "transparent",
					},
				}}
			/>
		</Stack>
	);
}
