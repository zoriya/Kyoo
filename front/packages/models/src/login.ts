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
import { createContext, useContext } from "react";
import { User } from "./resources/user";

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

export const loginFunc = async (
	action: "register" | "login" | "refresh",
	body: object | string,
): Promise<Result<Token, string>> => {
	try {
		const token = await queryFn(
			{
				path: ["auth", action, typeof body === "string" && `?token=${body}`],
				method: typeof body === "string" ? "GET" : "POST",
				body: typeof body === "object" ? body : undefined,
				authenticated: false,
			},
			TokenP,
		);

		if (typeof window !== "undefined") await setSecureItem("auth", JSON.stringify(token));
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
	(await getTokenWJ(cookies))[0]

export const logout = async () =>{
	deleteSecureItem("auth")
}
