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

import { PortalProvider } from "@gorhom/portal";
import { ThemeSelector, ts } from "@kyoo/primitives";
import { NavbarRight, NavbarTitle } from "@kyoo/ui";
import { createQueryClient } from "@kyoo/models";
import { QueryClientProvider } from "@tanstack/react-query";
import i18next from "i18next";
import { Stack } from "expo-router";
import { getLocales } from "expo-localization";
import * as SplashScreen from "expo-splash-screen";
import {
	useFonts,
	Poppins_300Light,
	Poppins_400Regular,
	Poppins_900Black,
} from "@expo-google-fonts/poppins";
import { useCallback, useLayoutEffect, useState } from "react";
import { Platform, useColorScheme } from "react-native";
import { initReactI18next } from "react-i18next";
import { useTheme, useYoshiki } from "yoshiki/native";
import "intl-pluralrules";

// TODO: use a backend to load jsons.
import en from "../../../translations/en.json";
import fr from "../../../translations/fr.json";

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

const ThemedStack = ({ onLayout }: { onLayout?: () => void }) => {
	const { css, theme } = useYoshiki();

	return (
		<Stack
			screenOptions={
				Platform.isTV
					? {
							headerTitle: () => null,
							headerRight: () => (
								<NavbarTitle
									onLayout={onLayout}
									{...css({ paddingTop: ts(4), paddingRight: ts(4) })}
								/>
							),
							contentStyle: {
								backgroundColor: theme.background,
							},
							headerStyle: { backgroundColor: "transparent" },
							headerBackVisible: false,
							headerTransparent: true,
					  }
					: {
							headerTitle: () => <NavbarTitle onLayout={onLayout} />,
							headerRight: () => <NavbarRight />,
							contentStyle: {
								backgroundColor: theme.background,
							},
							headerStyle: {
								backgroundColor: theme.accent,
							},
							headerTintColor: theme.colors.white,
					  }
			}
		/>
	);
};

SplashScreen.preventAutoHideAsync();

export default function Root() {
	const [queryClient] = useState(() => createQueryClient());
	const theme = useColorScheme();
	const [fontsLoaded] = useFonts({ Poppins_300Light, Poppins_400Regular, Poppins_900Black });

	useLayoutEffect(() => {
		// This does not seems to work on the global scope so why not.
		SplashScreen.preventAutoHideAsync();
	});

	const onLayout = useCallback(async () => {
		if (fontsLoaded) {
			await SplashScreen.hideAsync();
		}
	}, [fontsLoaded]);

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
					<ThemedStack onLayout={onLayout} />
				</PortalProvider>
			</ThemeSelector>
		</QueryClientProvider>
	);
}
