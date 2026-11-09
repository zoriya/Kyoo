import {
	DefaultTheme,
	ThemeProvider as RNThemeProvider,
} from "expo-router/react-navigation";
import type { ReactNode } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { type AndroidBackend, OmniProvider } from "react-native-omni";
import { SafeAreaListener } from "react-native-safe-area-context";
import { PortalProvider } from "react-native-teleport";
import {
	Uniwind,
	useCSSVariable,
	useResolveClassNames,
	useUniwind,
} from "uniwind";
import { KyooDataProvider } from "~/data";
import { AccountProvider } from "./account-provider";
import { useLocalSetting } from "./settings";
import { TranslationsProvider } from "./translations.native";

const PlayerProvider = ({ children }: { children: ReactNode }) => {
	const [player] = useLocalSetting<AndroidBackend>("player", "auto");
	return (
		<OmniProvider
			backend={{ android: player }}
			cast={{
				receiverApplicationId:
					process.env.EXPO_PUBLIC_CAST_APPLICATION_ID ?? "D8FB0FC1",
				notificationUrl: "kyoo:///remote",
			}}
			showNotification
		>
			{children}
		</OmniProvider>
	);
};

const RnTheme = ({ children }: { children: ReactNode }) => {
	const { theme } = useUniwind();
	const [accent, background, card, popover] = useCSSVariable([
		"--color-accent",
		"--color-background",
		"--color-card",
		"--color-popover",
	]) as string[];
	const { color } = useResolveClassNames("text-slate-600 dark:text-slate-400");

	return (
		<RNThemeProvider
			value={{
				dark: theme === "dark",
				colors: {
					primary: accent,
					card: card,
					text: color as string,
					border: background,
					notification: popover,
					background: background,
				},
				fonts: DefaultTheme.fonts,
			}}
		>
			<SafeAreaListener
				onChange={({ insets }) => {
					Uniwind.updateInsets(insets);
				}}
			>
				{children}
			</SafeAreaListener>
		</RNThemeProvider>
	);
};

export const Providers = ({ children }: { children: ReactNode }) => {
	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<RnTheme>
				<TranslationsProvider>
					<KyooDataProvider>
						<AccountProvider>
							<PortalProvider>
								<PlayerProvider>{children}</PlayerProvider>
							</PortalProvider>
						</AccountProvider>
					</KyooDataProvider>
				</TranslationsProvider>
			</RnTheme>
		</GestureHandlerRootView>
	);
};
