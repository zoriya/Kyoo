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

import {
	Poppins_300Light,
	Poppins_400Regular,
	Poppins_900Black,
	useFonts,
} from "@expo-google-fonts/poppins";
import { PortalProvider } from "@gorhom/portal";
import { AccountProvider, createQueryClient, storage, useUserTheme } from "@kyoo/models";
import { SnackbarProvider, ThemeSelector } from "@kyoo/primitives";
import { DownloadProvider } from "@kyoo/ui";
import { ThemeProvider as RNThemeProvider } from "@react-navigation/native";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { getLocales } from "expo-localization";
import { Slot } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import i18next from "i18next";
import "intl-pluralrules";
import { type ReactNode, useEffect, useState } from "react";
import { initReactI18next } from "react-i18next";
import { useColorScheme } from "react-native";
import resources from "../../../translations";

import NetInfo from "@react-native-community/netinfo";
import { onlineManager } from "@tanstack/react-query";
import { useTheme } from "yoshiki/native";

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

const sysLang = getLocales()[0].languageCode ?? "en";
i18next.use(initReactI18next).init({
	interpolation: {
		escapeValue: false,
	},
	returnEmptyString: false,
	fallbackLng: "en",
	lng: storage.getString("language") ?? sysLang,
	resources,
});
// @ts-expect-error Manually added value
i18next.systemLanguage = sysLang;

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
