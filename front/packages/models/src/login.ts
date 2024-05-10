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

import { queryFn } from "./query";
import { KyooErrors } from "./kyoo-errors";
import { Account, Token, TokenP, getCurrentApiUrl } from "./accounts";
import { UserP } from "./resources";
import { addAccount, getCurrentAccount, removeAccounts, updateAccount } from "./account-internal";
import { Platform } from "react-native";
import { useEffect, useRef, useState } from "react";

type Result<A, B> =
	| { ok: true; value: A; error?: undefined }
	| { ok: false; value?: undefined; error: B };

export const login = async (
	action: "register" | "login",
	{ apiUrl, ...body }: { username: string; password: string; email?: string; apiUrl?: string },
): Promise<Result<Account, string>> => {
	if (!apiUrl || apiUrl.length === 0) apiUrl = getCurrentApiUrl()!;
	try {
		const controller = new AbortController();
		setTimeout(() => controller.abort(), 5_000);
		const token = await queryFn(
			{
				path: ["auth", action],
				method: "POST",
				body,
				authenticated: false,
				apiUrl,
				signal: controller.signal,
			},
			TokenP,
		);
		const user = await queryFn(
			{ path: ["auth", "me"], method: "GET", apiUrl },
			UserP,
			`Bearer ${token.access_token}`,
		);
		const account: Account = { ...user, apiUrl: apiUrl, token, selected: true };
		addAccount(account);
		return { ok: true, value: account };
	} catch (e) {
		console.error(action, e);
		return { ok: false, error: (e as KyooErrors).errors[0] };
	}
};

export const oidcLogin = async (provider: string, code: string, apiUrl?: string) => {
	if (!apiUrl || apiUrl.length === 0) apiUrl = getCurrentApiUrl()!;
	try {
		const token = await queryFn(
			{
				path: ["auth", "callback", provider, `?code=${code}`],
				method: "POST",
				authenticated: false,
				apiUrl,
			},
			TokenP,
		);
		const user = await queryFn(
			{ path: ["auth", "me"], method: "GET", apiUrl },
			UserP,
			`Bearer ${token.access_token}`,
		);
		const account: Account = { ...user, apiUrl: apiUrl, token, selected: true };
		addAccount(account);
		return { ok: true, value: account };
	} catch (e) {
		console.error("oidcLogin", e);
		return { ok: false, error: (e as KyooErrors).errors[0] };
	}
};

let running_id: string | null = null;
let running: ReturnType<typeof getTokenWJ> | null = null;

export const getTokenWJ = async (
	acc?: Account | null,
	forceRefresh = false,
): Promise<readonly [string, Token, null] | readonly [null, null, KyooErrors | null]> => {
	if (acc === undefined) acc = getCurrentAccount();
	if (!acc) return [null, null, null] as const;
	const account = acc;

	async function run() {
		let token = account.token;

		if (forceRefresh || account.token.expire_at <= new Date(new Date().getTime() + 10 * 1000)) {
			console.log("refreshing token for account", account.slug);
			try {
				token = await queryFn(
					{
						path: ["auth", "refresh", `?token=${account.token.refresh_token}`],
						method: "GET",
						authenticated: false,
					},
					TokenP,
				);
				if (Platform.OS !== "web" || typeof window !== "undefined")
					updateAccount(account.id, { ...account, token });
			} catch (e) {
				console.error("Error refreshing token durring ssr:", e);
				return [null, null, e as KyooErrors] as const;
			}
		}
		return [`${token.token_type} ${token.access_token}`, token, null] as const;
	}

	// Do not cache promise durring ssr.
	if (Platform.OS === "web" && typeof window === "undefined") return await run();

	if (running && running_id === account.id) return await running;
	running_id = account.id;
	running = run();
	const ret = await running;
	running_id = null;
	running = null;
	return ret;
};

export const getToken = async (): Promise<string | null> => (await getTokenWJ())[0];

export const getCurrentToken = () => {
	const account = getCurrentAccount();
	return account ? `${account.token.token_type} ${account.token.access_token}` : null;
};

export const useToken = () => {
	const account = getCurrentAccount();
	const refresher = useRef<NodeJS.Timeout | null>(null);
	const [token, setToken] = useState(
		account ? `${account.token.token_type} ${account.token.access_token}` : null,
	);

	// biome-ignore lint/correctness/useExhaustiveDependencies: Refresh token when account change
	useEffect(() => {
		async function run() {
			const nToken = await getTokenWJ();
			setToken(nToken[0]);
			if (refresher.current) clearTimeout(refresher.current);
			if (nToken[1])
				refresher.current = setTimeout(run, nToken[1].expire_at.getTime() - Date.now());
		}
		run();
		return () => {
			if (refresher.current) clearTimeout(refresher.current);
		};
	}, [account]);

	if (!token) return null;
	return token;
};

export const logout = () => {
	removeAccounts((x) => x.selected);
};

export const deleteAccount = async () => {
	await queryFn({ path: ["auth", "me"], method: "DELETE" });
	logout();
};
