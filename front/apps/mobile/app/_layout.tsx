/*
 * Kyoo - A portable and vast media library solution.
 * Copyright (c) Kyoo.
 *
 * See AUTHORS.md and LICENSE file in the project root for full license information.
 *
 * Kyoo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * Kyoo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Kyoo. If not, see <https://www.gnu.org/licenses/>.
 */

import "react-native-reanimated";

import { PortalProvider } from "@gorhom/portal";
import { SnackbarProvider, ThemeSelector } from "@kyoo/primitives";
import { DownloadProvider } from "@kyoo/ui";
import { AccountProvider, createQueryClient, storage, useUserTheme } from "@kyoo/models";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import i18next from "i18next";
import { Slot } from "expo-router";
import { getLocales } from "expo-localization";
import * as SplashScreen from "expo-splash-screen";
import {
	useFonts,
	Poppins_300Light,
	Poppins_400Regular,
	Poppins_900Black,
} from "@expo-google-fonts/poppins";
import { type ReactNode, useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import { initReactI18next } from "react-i18next";
import { ThemeProvider as RNThemeProvider } from "@react-navigation/native";
import "intl-pluralrules";
import "@formatjs/intl-locale/polyfill";
import "@formatjs/intl-displaynames/polyfill";
import "@formatjs/intl-displaynames/locale-data/en";
import "@formatjs/intl-displaynames/locale-data/fr";

// TODO: use a backend to load jsons.
import en from "../../../translations/en.json";
import fr from "../../../translations/fr.json";
import zh from "../../../translations/zh.json";
import { useTheme } from "yoshiki/native";
import NetInfo from "@react-native-community/netinfo";
import { onlineManager } from "@tanstack/react-query";

onlineManager.setEventListener((setOnline) => {
	return NetInfo.addEventListener((state) => {
		setOnline(!!state.isConnected);
	});
});

const clientStorage = {
	setItem: (key, value) => {
		storage.set(key, value);
	},
	getItem: (key) => {
		const value = storage.getString(key);
		return value === undefined ? null : value;
	},
	removeItem: (key) => {
		storage.delete(key);
	},
} satisfies Partial<Storage>;

export const clientPersister = createSyncStoragePersister({ storage: clientStorage });

i18next.use(initReactI18next).init({
	interpolation: {
		escapeValue: false,
	},
	fallbackLng: "en",
	lng: getLocales()[0].languageCode ?? "en",
	resources: {
		en: { translation: en },
		fr: { translation: fr },
		zh: { translation: zh },
	},
});

const NavigationThemeProvider = ({ children }: { children: ReactNode }) => {
	const theme = useTheme();
	return (
		<RNThemeProvider
			value={{
				dark: theme.mode === "dark",
				colors: {
					primary: theme.accent,
					card: theme.variant.background,
					text: theme.paragraph,
					border: theme.background,
					notification: theme.background,
					background: theme.background,
				},
			}}
		>
			{children}
		</RNThemeProvider>
	);
};

SplashScreen.preventAutoHideAsync();

export default function Root() {
	const [queryClient] = useState(() => createQueryClient());
	let theme = useUserTheme();
	const systemTheme = useColorScheme();
	const [fontsLoaded] = useFonts({ Poppins_300Light, Poppins_400Regular, Poppins_900Black });

	if (theme === "auto") theme = systemTheme ?? "light";

	useEffect(() => {
		if (fontsLoaded) SplashScreen.hideAsync();
	}, [fontsLoaded]);

	if (!fontsLoaded) return null;
	return (
		<PersistQueryClientProvider
			client={queryClient}
			persistOptions={{
				persister: clientPersister,
				// Only dehydrate mutations, queries are not json serializable anyways.
				dehydrateOptions: { shouldDehydrateQuery: () => false },
			}}
			onSuccess={async () => {
				await queryClient.resumePausedMutations();
				queryClient.invalidateQueries();
			}}
		>
			<ThemeSelector
				theme={theme}
				font={{
					normal: "Poppins_400Regular",
					"300": "Poppins_300Light",
					"400": "Poppins_400Regular",
					"900": "Poppins_900Black",
				}}
			>
				<PortalProvider>
					<AccountProvider>
						<DownloadProvider>
							<NavigationThemeProvider>
								<SnackbarProvider>
									<Slot />
								</SnackbarProvider>
							</NavigationThemeProvider>
						</DownloadProvider>
					</AccountProvider>
				</PortalProvider>
			</ThemeSelector>
		</PersistQueryClientProvider>
	);
}
