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

import { z } from "zod";
import { deleteSecureItem, getSecureItem, setSecureItem } from "./secure-store";
import { zdate } from "./utils";
import { queryFn } from "./query";
import { KyooErrors } from "./kyoo-errors";
import { Platform } from "react-native";

const TokenP = z.object({
	token_type: z.literal("Bearer"),
	access_token: z.string(),
	refresh_token: z.string(),
	expire_in: z.string(),
	expire_at: zdate(),
});
type Token = z.infer<typeof TokenP>;

type Result<A, B> =
	| { ok: true; value: A; error?: undefined }
	| { ok: false; value?: undefined; error: B };

export type Account = Token & { apiUrl: string; username: string };

const addAccount = (token: Token, apiUrl: string, username: string | null) => {
	const accounts: Account[] = JSON.parse(getSecureItem("accounts") ?? "[]");
	if (accounts.find((x) => x.username === username && x.apiUrl === apiUrl)) return;
	accounts.push({ ...token, username: username!, apiUrl });
	setSecureItem("accounts", JSON.stringify(accounts));
};

const setCurrentAccountToken = (token: Token) => {
	const accounts: Account[] = JSON.parse(getSecureItem("accounts") ?? "[]");
	const selected = parseInt(getSecureItem("selected") ?? "0");
	if (selected >= accounts.length) return;

	accounts[selected] = { ...accounts[selected], ...token };
	setSecureItem("accounts", JSON.stringify(accounts));
};

export const loginFunc = async (
	action: "register" | "login" | "refresh",
	body: { username: string; password: string; email?: string } | string,
	apiUrl?: string,
): Promise<Result<Token, string>> => {
	try {
		const token = await queryFn(
			{
				path: ["auth", action, typeof body === "string" && `?token=${body}`],
				method: typeof body === "string" ? "GET" : "POST",
				body: typeof body === "object" ? body : undefined,
				authenticated: false,
				apiUrl,
			},
			TokenP,
		);

		if (typeof window !== "undefined") setSecureItem("auth", JSON.stringify(token));
		if (Platform.OS !== "web" && apiUrl && typeof body !== "string")
			addAccount(token, apiUrl, body.username);
		else if (Platform.OS !== "web" && action === "refresh") setCurrentAccountToken(token);
		return { ok: true, value: token };
	} catch (e) {
		console.error(action, e);
		return { ok: false, error: (e as KyooErrors).errors[0] };
	}
};

export const getTokenWJ = async (cookies?: string): Promise<[string, Token] | [null, null]> => {
	const tokenStr = getSecureItem("auth", cookies);
	if (!tokenStr) return [null, null];
	let token = TokenP.parse(JSON.parse(tokenStr));

	if (token.expire_at <= new Date(new Date().getTime() + 10 * 1000)) {
		const { ok, value: nToken, error } = await loginFunc("refresh", token.refresh_token);
		if (!ok) console.error("Error refreshing token durring ssr:", error);
		else token = nToken;
	}
	return [`${token.token_type} ${token.access_token}`, token];
};

export const getToken = async (cookies?: string): Promise<string | null> =>
	(await getTokenWJ(cookies))[0];

export const logout = () => {
	if (Platform.OS !== "web") {
		let accounts: Account[] = JSON.parse(getSecureItem("accounts") ?? "[]");
		const selected = parseInt(getSecureItem("selected") ?? "0");
		accounts.splice(selected, 1);
		setSecureItem("accounts", JSON.stringify(accounts));
	}

	deleteSecureItem("auth");
};

export const deleteAccount = async () => {
	await queryFn({ path: ["auth", "me"], method: "DELETE" });
	logout();
};
