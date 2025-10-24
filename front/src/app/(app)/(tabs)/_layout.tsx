import Browse from "@material-symbols/svg-400/rounded/browse-fill.svg";
// import Downloading from "@material-symbols/svg-400/rounded/downloading-fill.svg";
import Home from "@material-symbols/svg-400/rounded/home-fill.svg";
import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";
import { Icon } from "~/primitives";

export default function TabsLayout() {
	const { t } = useTranslation();

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
					tabBarIcon: ({ color, size }) => (
						<Icon icon={Home} color={color} size={size} />
					),
				}}
			/>
			<Tabs.Screen
				name="browse"
				options={{
					tabBarLabel: t("navbar.browse"),
					tabBarIcon: ({ color, size }) => (
						<Icon icon={Browse} color={color} size={size} />
					),
				}}
			/>
			{/* <Tabs.Screen */}
			{/* 	name="downloads" */}
			{/* 	options={{ */}
			{/* 		tabBarLabel: t("navbar.download"), */}
			{/* 		tabBarIcon: ({ color, size }) => ( */}
			{/* 			<Icon icon={Downloading} color={color} size={size} /> */}
			{/* 		), */}
			{/* 	}} */}
			{/* /> */}
		</Tabs>
	);
}
