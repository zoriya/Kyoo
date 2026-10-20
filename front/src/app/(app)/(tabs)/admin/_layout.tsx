import { Slot } from "expo-router";
import { TopTabs } from "expo-router/js-top-tabs";
import {
	type NavigationProp,
	type ParamListBase,
	useFocusEffect,
	useNavigation,
} from "expo-router/react-navigation";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Platform } from "react-native";
import { useCSSVariable, useResolveClassNames } from "uniwind";

export const unstable_settings = {
	anchor: "unmatched",
};

export default function AdminTabsLayout() {
	const { t } = useTranslation();
	const navigation = useNavigation<NavigationProp<ParamListBase>>();
	const accent = useCSSVariable("--color-accent");
	const { color: activeColor } = useResolveClassNames("text-slate-100");
	const { color: inactiveColor } = useResolveClassNames("text-slate-400");
	const { color: borderColor } = useResolveClassNames("border-slate-700");

	useFocusEffect(
		useCallback(() => {
			for (let nav = navigation; nav; nav = nav.getParent()) {
				nav.setOptions({ headerShadowVisible: false });
			}

			return () => {
				for (let nav = navigation; nav; nav = nav.getParent()) {
					nav.setOptions({ headerShadowVisible: undefined });
				}
			};
		}, [navigation]),
	);

	if (Platform.OS === "web") return <Slot />;

	return (
		<TopTabs
			screenOptions={{
				tabBarStyle: {
					backgroundColor: accent as string,
					borderBottomColor: borderColor as string,
				},
				tabBarIndicatorStyle: {
					backgroundColor: activeColor as string,
				},
				tabBarActiveTintColor: activeColor as string,
				tabBarInactiveTintColor: inactiveColor as string,
			}}
		>
			<TopTabs.Screen
				name="unmatched"
				options={{
					tabBarLabel: t("admin.unmatched.label"),
				}}
			/>
			<TopTabs.Screen
				name="streams"
				options={{
					tabBarLabel: t("admin.streams.title"),
				}}
			/>
			<TopTabs.Screen
				name="users"
				options={{
					tabBarLabel: t("admin.users.label"),
				}}
			/>
		</TopTabs>
	);
}
