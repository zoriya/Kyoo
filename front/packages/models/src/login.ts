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
import { Account, TokenP } from "./accounts";
import { UserP } from "./resources";
import {
	addAccount,
	getCurrentAccount,
	removeAccounts,
	unselectAllAccounts,
	updateAccount,
} from "./account-internal";
import { Platform } from "react-native";

type Result<A, B> =
	| { ok: true; value: A; error?: undefined }
	| { ok: false; value?: undefined; error: B };

export const login = async (
	action: "register" | "login",
	{ apiUrl, ...body }: { username: string; password: string; email?: string; apiUrl?: string },
	timeout?: number,
): Promise<Result<Account, string>> => {
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
		const account: Account = { ...user, apiUrl: apiUrl ?? "/api", token, selected: true };
		addAccount(account);
		return { ok: true, value: account };
	} catch (e) {
		console.error(action, e);
		return { ok: false, error: (e as KyooErrors).errors[0] };
	}
};

let running: ReturnType<typeof getTokenWJ> | null = null;

export const getTokenWJ = async (account?: Account | null): ReturnType<typeof run> => {
	async function run() {
		if (account === undefined) account = getCurrentAccount();
		if (!account) return [null, null] as const;

		let token = account.token;

		if (account.token.expire_at <= new Date(new Date().getTime() + 10 * 1000)) {
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
				if (Platform.OS !== "web" || typeof window !== "undefined") unselectAllAccounts();
				return [null, null];
			}
		}
		return [`${token.token_type} ${token.access_token}`, token] as const;
	}

	// Do not cache promise durring ssr.
	if (Platform.OS === "web" && typeof window === "undefined") return await run();

	if (running) return await running;
	running = run();
	const ret = await running;
	running = null;
	return ret;
};

export const getToken = async (): Promise<string | null> => (await getTokenWJ())[0];

export const logout = () => {
	removeAccounts((x) => x.selected);
};

export const deleteAccount = async () => {
	await queryFn({ path: ["auth", "me"], method: "DELETE" });
	logout();
};
