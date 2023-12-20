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

import { QueryIdentifier, QueryPage, User, UserP, setUserTheme, useUserTheme } from "@kyoo/models";
import { Container, P, Select, ts } from "@kyoo/primitives";
import { DefaultLayout } from "../layout";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";
import { useYoshiki } from "yoshiki/native";

const Preference = ({ label, children, ...props }: { label: string; children: ReactNode }) => {
	const { css } = useYoshiki();

	return (
		<View
			{...css(
				{
					margin: ts(1),
					flexGrow: 1,
					flexDirection: "row",
					justifyContent: "space-between",
					alignItems: "center",
				},
				props,
			)}
		>
			<P>{label}</P>
			{children}
		</View>
	);
};

const query: QueryIdentifier<User> = {
	parser: UserP,
	path: ["auth", "me"],
};

export const SettingsPage: QueryPage = () => {
	const { t } = useTranslation();

	const theme = useUserTheme("auto");
	return (
		<ScrollView>
			<Container>
				<Preference label={t("settings.theme.label")}>
					<Select
						label={t("settings.theme.label")}
						value={theme}
						onValueChange={(value) => setUserTheme(value)}
						values={["auto", "light", "dark"]}
						getLabel={(key) => t(`settings.theme.${key}`)}
					/>
				</Preference>
			</Container>
		</ScrollView>
	);
};

SettingsPage.getLayout = DefaultLayout;

SettingsPage.getFetchUrls = () => [query];
