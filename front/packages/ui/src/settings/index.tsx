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
import { Container, H1, H2, IconButton, P, Select, tooltip, ts } from "@kyoo/primitives";
import { DefaultLayout } from "../layout";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Platform, ScrollView, ToastAndroid, View } from "react-native";
import { useYoshiki } from "yoshiki/native";
import Info from "@material-symbols/svg-400/rounded/info.svg";

const Preference = ({
	label,
	info,
	children,
	...props
}: {
	label: string;
	info?: string;
	children: ReactNode;
}) => {
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
			<View {...css({ flexDirection: "row" })}>
				<P>{label}</P>
				{info && (
					<IconButton
						icon={Info}
						onPress={
							Platform.OS === "android"
								? () => ToastAndroid.show(info, ToastAndroid.LONG)
								: undefined
						}
						{...tooltip(info)}
					/>
				)}
			</View>
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

				<H2>{t("settings.downloads.title")}</H2>
				<Preference
					label={t("settings.downloads.quality.label")}
					info={t("settings.downloads.quality.info")}
				>
					<Select
						label={t("settings.downloads.quality.label")}
						value={"original"}
						// TODO: Implement this setter
						onValueChange={(value) => {}}
						values={["original", "8k", "4k", "1440p", "1080p", "720p", "480p", "360p", "240p"]}
						getLabel={(key) => (key === "original" ? t("player.direct") : key)}
					/>
				</Preference>
			</Container>
		</ScrollView>
	);
};

SettingsPage.getLayout = DefaultLayout;

SettingsPage.getFetchUrls = () => [query];
