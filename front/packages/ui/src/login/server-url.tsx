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

import { QueryIdentifier, QueryPage, ServerInfo, ServerInfoP, useFetch } from "@kyoo/models";
import { Button, P, Link, Input, ts, H1, HR } from "@kyoo/primitives";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ImageBackground, Platform, View } from "react-native";
import { useRouter } from "solito/router";
import { Theme, percent, useYoshiki } from "yoshiki/native";
import { DefaultLayout } from "../layout";

export const cleanApiUrl = (apiUrl: string) => {
	if (Platform.OS === "web") return undefined;
	if (!/https?:\/\//.test(apiUrl)) apiUrl = `http://${apiUrl}`;
	apiUrl = apiUrl.replace(/\/$/, "");
	return `${apiUrl}/api`;
};

const query: QueryIdentifier<ServerInfo> = {
	path: ["info"],
	parser: ServerInfoP,
};

export const ServerUrlPage: QueryPage = () => {
	const [_apiUrl, setApiUrl] = useState("");
	const apiUrl = cleanApiUrl(_apiUrl);
	const { data, error } = useFetch({ ...query, options: { apiUrl } });
	const router = useRouter();
	const { t } = useTranslation();
	const { css } = useYoshiki();

	return (
		<View
			{...css({
				marginX: ts(3),
				justifyContent: "space-between",
				flexGrow: 1,
			})}
		>
			<H1>{t("login.server")}</H1>
			<View {...css({ justifyContent: "center" })}>
				<Input variant="big" onChangeText={setApiUrl} />
				{!data && (
					<P {...css({ color: (theme: Theme) => theme.colors.red, alignSelf: "center" })}>
						{error?.errors[0] ?? t("misc.loading")}
					</P>
				)}
			</View>
			<View {...css({ marginTop: ts(5) })}>
				<View {...css({ flexDirection: "row", width: percent(100), alignItems: "center" })}>
					{data &&
						Object.values(data.oidc).map((x) => (
							<Link
								key={x.displayName}
								href={{ pathname: x.link, query: { apiUrl } }}
								{...css({ justifyContent: "center" })}
							>
								{x.logoUrl != null ? (
									<ImageBackground
										source={{ uri: x.logoUrl }}
										{...css({ width: ts(3), height: ts(3), margin: ts(1) })}
									/>
								) : (
									t("login.via", { provider: x.displayName })
								)}
							</Link>
						))}
				</View>
				<HR />
				<View {...css({ flexDirection: "row", gap: ts(2) })}>
					<Button
						text={t("login.login")}
						onPress={() => {
							router.push(`/login?apiUrl=${apiUrl}`);
						}}
						disabled={data == null}
						{...css({ flexGrow: 1, flexShrink: 1 })}
					/>
					<Button
						text={t("login.register")}
						onPress={() => {
							router.push(`/register?apiUrl=${apiUrl}`);
						}}
						disabled={data == null}
						{...css({ flexGrow: 1, flexShrink: 1 })}
					/>
				</View>
			</View>
			<View />
		</View>
	);
};

ServerUrlPage.getLayout = DefaultLayout;
