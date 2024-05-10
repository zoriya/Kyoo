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

import {
	type QueryIdentifier,
	type QueryPage,
	type ServerInfo,
	ServerInfoP,
	oidcLogin,
	useFetch,
} from "@kyoo/models";
import { Button, HR, Link, P, Skeleton, ts } from "@kyoo/primitives";
import { View, ImageBackground } from "react-native";
import { percent, rem, useYoshiki } from "yoshiki/native";
import { useTranslation } from "react-i18next";
import { useEffect, useRef } from "react";
import { useRouter } from "solito/router";
import { ErrorView } from "../errors";

export const OidcLogin = ({ apiUrl }: { apiUrl?: string }) => {
	const { css } = useYoshiki();
	const { t } = useTranslation();
	const { data, error } = useFetch({ options: { apiUrl }, ...OidcLogin.query() });

	const btn = css({ width: { xs: percent(100), sm: percent(75) }, marginY: ts(1) });

	return (
		<View {...css({ alignItems: "center", marginY: ts(1) })}>
			{error ? (
				<ErrorView error={error} />
			) : data ? (
				Object.values(data.oidc).map((x) => (
					<Button
						as={Link}
						href={{ pathname: x.link, query: { apiUrl } }}
						key={x.displayName}
						licon={
							x.logoUrl != null && (
								<ImageBackground
									source={{ uri: x.logoUrl }}
									{...css({ width: ts(3), height: ts(3), marginRight: ts(2) })}
								/>
							)
						}
						text={t("login.via", { provider: x.displayName })}
						{...btn}
					/>
				))
			) : (
				[...Array(3)].map((_, i) => (
					<Button key={i} {...btn}>
						<Skeleton {...css({ width: percent(66), marginY: rem(0.5) })} />
					</Button>
				))
			)}
			<View
				{...css({
					marginY: ts(1),
					flexDirection: "row",
					width: percent(100),
					alignItems: "center",
				})}
			>
				<HR {...css({ flexGrow: 1 })} />
				<P>{t("misc.or")}</P>
				<HR {...css({ flexGrow: 1 })} />
			</View>
		</View>
	);
};

OidcLogin.query = (): QueryIdentifier<ServerInfo> => ({
	path: ["info"],
	parser: ServerInfoP,
});

export const OidcCallbackPage: QueryPage<{
	apiUrl?: string;
	provider: string;
	code: string;
	error?: string;
}> = ({ apiUrl, provider, code, error }) => {
	const hasRun = useRef(false);
	const router = useRouter();

	useEffect(() => {
		if (hasRun.current) return;
		hasRun.current = true;

		function onError(error: string) {
			router.replace({ pathname: "/login", query: { error, apiUrl } }, undefined, {
				experimental: { nativeBehavior: "stack-replace", isNestedNavigator: false },
			});
		}
		async function run() {
			const { error: loginError } = await oidcLogin(provider, code, apiUrl);
			if (loginError) onError(loginError);
			else {
				router.replace("/", undefined, {
					experimental: { nativeBehavior: "stack-replace", isNestedNavigator: false },
				});
			}
		}

		if (error) onError(error);
		else run();
	}, [provider, code, apiUrl, router, error]);
	return <P>{"Loading"}</P>;
};
