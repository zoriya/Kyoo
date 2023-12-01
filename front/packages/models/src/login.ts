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
import { Account, Token, TokenP } from "./accounts";
import { UserP } from "./resources";
import { addAccount, getCurrentAccount, removeAccounts, updateAccount } from "./account-internal";

type Result<A, B> =
	| { ok: true; value: A; error?: undefined }
	| { ok: false; value?: undefined; error: B };

export const login = async (
	action: "register" | "login",
	{ apiUrl, ...body }: { username: string; password: string; email?: string; apiUrl?: string },
	timeout?: number,
): Promise<Result<Account, string>> => {
	try {
		const token = await queryFn(
			{
				path: ["auth", action],
				method: "POST",
				body,
				authenticated: false,
				apiUrl,
				timeout,
			},
			TokenP,
		);
		const user = await queryFn(
			{ path: ["auth", "me"], method: "GET", apiUrl },
			UserP,
			token.access_token,
		);
		const account: Account = { ...user, apiUrl: apiUrl ?? "/api", token, selected: true };
		addAccount(account);
		return { ok: true, value: account };
	} catch (e) {
		console.error(action, e);
		return { ok: false, error: (e as KyooErrors).errors[0] };
	}
};

export const getTokenWJ = async (account?: Account | null): Promise<[string, Token] | [null, null]> => {
	if (account === undefined)
		account = getCurrentAccount();
	if (!account) return [null, null];

	if (account.token.expire_at <= new Date(new Date().getTime() + 10 * 1000)) {
		try {
			const token = await queryFn(
				{
					path: ["auth", "refresh", `?token=${account.token.refresh_token}`],
					method: "GET",
				},
				TokenP,
			);
			updateAccount(account.id, { ...account, token });
		} catch (e) {
			console.error("Error refreshing token durring ssr:", e);
		}
	}
	return [`${account.token.token_type} ${account.token.access_token}`, account.token];
};

export const getToken = async (): Promise<string | null> =>
	(await getTokenWJ())[0];

export const logout = () => {
	removeAccounts((x) => x.selected);
};

export const deleteAccount = async () => {
	await queryFn({ path: ["auth", "me"], method: "DELETE" });
	logout();
};
