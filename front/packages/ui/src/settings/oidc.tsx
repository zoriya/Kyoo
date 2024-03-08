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

import { QueryIdentifier, ServerInfo, ServerInfoP, useAccount, useFetch } from "@kyoo/models";
import { IconButton, tooltip, ts } from "@kyoo/primitives";
import { useTranslation } from "react-i18next";
import { ImageBackground } from "react-native";
import { useYoshiki } from "yoshiki/native";
import { ErrorView } from "../errors";
import { Preference, SettingsContainer } from "./base";

import Badge from "@material-symbols/svg-400/outlined/badge.svg";
import OpenProfile from "@material-symbols/svg-400/outlined/open_in_new.svg";
import Remove from "@material-symbols/svg-400/outlined/close.svg";

export const OidcSettings = () => {
	const account = useAccount()!;
	const { css } = useYoshiki();
	const { t } = useTranslation();
	const { data, error } = useFetch(OidcSettings.query());

	return (
		<SettingsContainer title={t("settings.oidc.label")}>
			{error ? (
				<ErrorView error={error} />
			) : data ? (
				Object.values(data.oidc).map((x) => (
					<Preference
						key={x.displayName}
						icon={Badge}
						label={x.displayName}
						description={
							true
								? t("settings.oidc.connected", { username: "test" })
								: t("settings.oidc.not-connected")
						}
						customIcon={
							x.logoUrl != null && (
								<ImageBackground
									source={{ uri: x.logoUrl }}
									{...css({ width: ts(3), height: ts(3), marginRight: ts(2) })}
								/>
							)
						}
					>
						<IconButton
							icon={OpenProfile}
							onPress={() => {}}
							{...tooltip(t("settings.oidc.open-profile", { provider: x.displayName }))}
						/>
						<IconButton
							icon={Remove}
							onPress={() => {}}
							{...tooltip(t("settings.oidc.delete", { provider: x.displayName }))}
						/>
					</Preference>
				))
			) : null}
		</SettingsContainer>
	);
};

OidcSettings.query = (): QueryIdentifier<ServerInfo> => ({
	path: ["info"],
	parser: ServerInfoP,
});
