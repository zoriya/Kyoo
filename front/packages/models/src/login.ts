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
import { useEffect, useState } from "react";

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

export const useAccounts = () => {
	const [accounts] = useState<Account[]>(JSON.parse(getSecureItem("accounts") ?? "[]"));
	const [selected, setSelected] = useState<number>(parseInt(getSecureItem("selected") ?? "0"));

	return {
		accounts,
		selected,
		setSelected: (selected: number) => {
			setSelected(selected);
			setSecureItem("selected", selected.toString());
		},
	};
};

const addAccount = (token: Token, apiUrl: string, username: string | null)  => {
	const accounts: Account[] = JSON.parse(getSecureItem("accounts") ?? "[]");
	const accIdx = accounts.findIndex((x) => x.refresh_token === token.refresh_token);
	if (accIdx === -1) accounts.push({ ...token, username: username!, apiUrl });
	else accounts[accIdx] = { ...accounts[accIdx], ...token };
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

		if (typeof window !== "undefined") await setSecureItem("auth", JSON.stringify(token));
		if (Platform.OS !== "web" && apiUrl)
			await addAccount(token, apiUrl, typeof body !== "string" ? body.username : null);
		return { ok: true, value: token };
	} catch (e) {
		console.error(action, e);
		return { ok: false, error: (e as KyooErrors).errors[0] };
	}
};

export const getTokenWJ = async (cookies?: string): Promise<[string, Token] | [null, null]> => {
	// @ts-ignore Web only.
	const tokenStr = await getSecureItem("auth", cookies);
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

export const logout = async () => {
	if (Platform.OS !== "web") {
		const tokenStr = await getSecureItem("auth");
		if (!tokenStr) return;
		const token = TokenP.parse(JSON.parse(tokenStr));

		let accounts: Account[] = JSON.parse((await getSecureItem("accounts")) ?? "[]");
		accounts = accounts.filter((x) => x.refresh_token !== token.refresh_token);
		await setSecureItem("accounts", JSON.stringify(accounts));
	}

	await deleteSecureItem("auth");
};

export const deleteAccount = async () => {
	await queryFn({ path: ["auth", "me"], method: "DELETE" });
	await logout();
};
