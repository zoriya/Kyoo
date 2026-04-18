import { Slot } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useTranslation } from "react-i18next";
import { Platform } from "react-native";
import { useAccount } from "~/providers/account-context";

export const unstable_settings = {
	initialRouteName: "index",
};

export default function TabsLayout() {
	const { t } = useTranslation();
	const account = useAccount();

	if (Platform.OS === "web") return <Slot />;

	return (
		<NativeTabs>
			<NativeTabs.Trigger name="index">
				<NativeTabs.Trigger.Icon
					sf={{ default: "house", selected: "house.fill" }}
					md="home"
				/>
				<NativeTabs.Trigger.Label>{t("navbar.home")}</NativeTabs.Trigger.Label>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="browse">
				<NativeTabs.Trigger.Icon
					sf={{ default: "square.grid.2x2", selected: "square.grid.2x2.fill" }}
					md="browse"
				/>
				<NativeTabs.Trigger.Label>
					{t("navbar.browse")}
				</NativeTabs.Trigger.Label>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="profile">
				<NativeTabs.Trigger.Icon
					sf={{ default: "person", selected: "person.fill" }}
					md="person"
				/>
				<NativeTabs.Trigger.Label>
					{t("navbar.profile")}
				</NativeTabs.Trigger.Label>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="admin" hidden={!account?.isAdmin}>
				<NativeTabs.Trigger.Icon
					sf={{ default: "person.3", selected: "person.3.fill" }}
					md="admin_panel_settings"
				/>
				<NativeTabs.Trigger.Label>{t("navbar.admin")}</NativeTabs.Trigger.Label>
			</NativeTabs.Trigger>
		</NativeTabs>
	);
}
