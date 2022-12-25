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

import { Stack } from "expo-router";
import { ThemeSelector } from "@kyoo/primitives";
import { useTheme } from "yoshiki/native";
import { LoginAvatar, NavbarTitle } from "@kyoo/ui";
import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createQueryClient } from "@kyoo/models";
import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import { getLocales } from "expo-localization";
import { PortalProvider } from "@gorhom/portal";
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

const ThemedStack = () => {
	const theme = useTheme();

	return (
		<Stack
			screenOptions={{
				headerTitle: () => <NavbarTitle />,
				headerRight: () => <LoginAvatar />,
				headerStyle: {
					backgroundColor: theme.appbar,
				},
				headerTintColor: theme.colors.white,
				headerTitleStyle: {
					fontWeight: "bold",
				},
			}}
		/>
	);
};

export default function Root() {
	const [queryClient] = useState(() => createQueryClient());

	return (
		<QueryClientProvider client={queryClient}>
			<ThemeSelector>
				<PortalProvider>
					<ThemedStack />
				</PortalProvider>
			</ThemeSelector>
		</QueryClientProvider>
	);
}
