import Browse from "@material-symbols/svg-400/rounded/browse-fill.svg";
// import Downloading from "@material-symbols/svg-400/rounded/downloading-fill.svg";
import Home from "@material-symbols/svg-400/rounded/home-fill.svg";
import { Slot, Tabs } from "expo-router";
import { useTranslation } from "react-i18next";
import { Platform } from "react-native";
import { Icon } from "~/primitives";
import { cn } from "~/utils";

export const unstable_settings = {
	initialRouteName: "index",
};

export default function TabsLayout() {
	const { t } = useTranslation();

	if (Platform.OS === "web") return <Slot />;

	return (
		<Tabs
			screenOptions={{
				headerShown: false,
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					tabBarLabel: t("navbar.home"),
					tabBarIcon: ({ focused }) => {
						return (
							<Icon
								icon={Home}
								className={cn(focused && "fill-accent dark:fill-accent")}
							/>
						);
					},
				}}
			/>
			<Tabs.Screen
				name="browse"
				options={{
					tabBarLabel: t("navbar.browse"),
					tabBarIcon: ({ focused }) => (
						<Icon
							icon={Browse}
							className={cn(focused && "fill-accent dark:fill-accent")}
						/>
					),
				}}
			/>
		</Tabs>
	);
}
