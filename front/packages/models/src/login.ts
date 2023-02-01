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
import { getSecureItem, setSecureItem } from "./secure-store";
import { zdate } from "./utils";
import { queryFn } from "./query";
import { KyooErrors } from "./kyoo-errors";

const TokenP = z.object({
	token_type: z.literal("Bearer"),
	access_token: z.string(),
	refresh_token: z.string(),
	expire_in: z.string(),
	expire_at: zdate(),
});
type Token = z.infer<typeof TokenP>;

export const loginFunc = async (
	action: "register" | "login" | "refresh",
	body: object | string,
) => {
	try {
		const token = await queryFn(
			{
				path: ["auth", action, typeof body === "string" && `?token=${body}`],
				method: "POST",
				body: typeof body === "object" ? body : undefined,
				authenticated: false,
			},
			TokenP,
		);

		await setSecureItem("auth", JSON.stringify(token));
		return null;
	} catch (e) {
		console.error(action, e);
		return (e as KyooErrors).errors[0];
	}
};

export const getToken = async (): Promise<string | null> => {
	const tokenStr = await getSecureItem("auth");
	if (!tokenStr) return null;
	const token = JSON.parse(tokenStr) as Token;

	if (token.expire_at > new Date(new Date().getTime() + 10 * 1000)) {
		await loginFunc("refresh", token.refresh_token);
		return await getToken();
	}
	return `${token.token_type} ${token.access_token}`;
};
