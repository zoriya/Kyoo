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
import { Container, H1, Icon, P, Select, SubP, imageBorderRadius, ts } from "@kyoo/primitives";
import { DefaultLayout } from "../layout";
import { ReactElement, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";
import { px, rem, useYoshiki } from "yoshiki/native";

import Theme from "@material-symbols/svg-400/outlined/dark_mode.svg";

const Preference = ({
	icon,
	label,
	description,
	children,
	...props
}: {
	icon: Icon;
	label: string;
	description: string;
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
			<View {...css({ flexDirection: "row", alignItems: "center" })}>
				<Icon icon={icon} {...css({ marginX: ts(2) })} />
				<View>
					<P {...css({ marginBottom: 0 })}>{label}</P>
					<SubP>{description}</SubP>
				</View>
			</View>
			<View {...css({ marginX: ts(2) })}>{children}</View>
		</View>
	);
};

const SettingsContainer = ({ children, title }: { children: ReactElement; title: string }) => {
	const { css } = useYoshiki();
	return (
		<Container>
			<H1 {...css({ fontSize: rem(2) })}>{title}</H1>
			<View
				{...css({ bg: (theme) => theme.variant.background, borderRadius: px(imageBorderRadius) })}
			>
				{children}
			</View>
		</Container>
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
			<SettingsContainer title={t("settings.general.label")}>
				<Preference
					icon={Theme}
					label={t("settings.general.theme.label")}
					description={t("settings.general.theme.description")}
				>
					<Select
						label={t("settings.general.theme.label")}
						value={theme}
						onValueChange={(value) => setUserTheme(value)}
						values={["auto", "light", "dark"]}
						getLabel={(key) => t(`settings.general.theme.${key}`)}
					/>
				</Preference>
			</SettingsContainer>
		</ScrollView>
	);
};

SettingsPage.getLayout = DefaultLayout;

SettingsPage.getFetchUrls = () => [query];
