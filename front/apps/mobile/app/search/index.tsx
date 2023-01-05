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

import { SearchPage } from "@kyoo/ui";
import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { createParam } from "solito";
import { useRouter } from "solito/router";
import { useTheme } from "yoshiki/native";

const { useParam } = createParam<{ q?: string }>();

const Search = ({ route }: { route: any }) => {
	const theme = useTheme();
	const { back } = useRouter();
	const { t } = useTranslation();
	const [query, setQuery] = useParam("q");

	return (
		<>
			<Stack.Screen
				options={{
					headerTitle: () => null,
					// TODO: this shouuld not be null but since the header right is on the left of the search bar. shrug
					headerRight: () => null,
					headerSearchBarOptions: {
						autoFocus: true,
						headerIconColor: theme.colors.white,
						hintTextColor: theme.light.overlay1,
						textColor: theme.paragraph,
						placeholder: t("navbar.search")!,
						onClose: () => back(),
						onChangeText: (e) => setQuery(e.nativeEvent.text),
					},
				}}
			/>
			<SearchPage {...route.params} />
		</>
	);
};

export default Search;
