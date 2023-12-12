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
import { ThemeSelector } from "@kyoo/primitives";
import { AccountProvider, createQueryClient } from "@kyoo/models";
import { QueryClientProvider } from "@tanstack/react-query";
import i18next from "i18next";
import { Slot } from "expo-router";
import { getLocales } from "expo-localization";
import { SplashScreen } from "expo-router";
import {
	useFonts,
	Poppins_300Light,
	Poppins_400Regular,
	Poppins_900Black,
} from "@expo-google-fonts/poppins";
import { ReactNode, useState } from "react";
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
import { useTheme } from "yoshiki/native";

i18next.use(initReactI18next).init({
	interpolation: {
		escapeValue: false,
	},
	fallbackLng: "en",
	lng: getLocales()[0].languageCode,
	resources: {
		en: { translation: en },
		fr: { translation: fr },
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
	const theme = useColorScheme();
	const [fontsLoaded] = useFonts({ Poppins_300Light, Poppins_400Regular, Poppins_900Black });

	if (!fontsLoaded) return null;
	return (
		<QueryClientProvider client={queryClient}>
			<ThemeSelector
				theme={theme ?? "light"}
				font={{
					normal: "Poppins_400Regular",
					"300": "Poppins_300Light",
					"400": "Poppins_400Regular",
					"900": "Poppins_900Black",
				}}
			>
				<PortalProvider>
					<AccountProvider>
						<NavigationThemeProvider>
							<Slot />
						</NavigationThemeProvider>
					</AccountProvider>
				</PortalProvider>
			</ThemeSelector>
		</QueryClientProvider>
	);
}
