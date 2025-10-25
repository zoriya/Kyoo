import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "yoshiki/native";
import { ErrorConsumer } from "~/providers/error-consumer";
import { NavbarRight, NavbarTitle } from "~/ui/navbar";

export default function Layout() {
	const insets = useSafeAreaInsets();
	const theme = useTheme();

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
						backgroundColor: theme.accent,
					},
				}}
			>
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
