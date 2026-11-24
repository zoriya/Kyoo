import CloudOff from "@material-symbols/svg-400/rounded/cloud_off.svg";
import { usePathname, useSegments } from "expo-router";
import { useContext } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Portal } from "react-native-teleport";
import { useIsOffline } from "~/data";
import { A, Icon, P } from "~/primitives";
import { canDownload } from "~/ui/downloads/download";
import { TabBarHeightContext } from "~/ui/mini-player";

export const OfflineBanner = () => {
	const { t } = useTranslation();
	const offline = useIsOffline();
	const pathname = usePathname();
	const segments = useSegments();
	const insets = useSafeAreaInsets();
	const [tabBarHeight] = useContext(TabBarHeightContext);

	if (!offline || pathname.startsWith("/watch")) return null;
	return (
		<Portal hostName="root">
			<View
				pointerEvents="box-none"
				className="absolute right-0 left-0 items-center px-2"
				style={{
					bottom:
						(segments.includes("(tabs)") ? tabBarHeight : insets.bottom) + 8,
				}}
			>
				<View className="w-full max-w-md flex-row items-center gap-3 rounded-lg bg-slate-900 px-4 py-3 shadow-lg">
					<Icon
						icon={CloudOff}
						className="fill-slate-400 dark:fill-slate-400"
					/>
					<P className="flex-1 text-slate-200 dark:text-slate-200">
						{t("misc.offline")}
					</P>
					{canDownload && (
						<A href="/downloads" className="font-medium uppercase">
							{t("downloads.title")}
						</A>
					)}
				</View>
			</View>
		</Portal>
	);
};
