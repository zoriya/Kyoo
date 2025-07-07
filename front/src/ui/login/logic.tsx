import { z } from "zod/v4";
import { type Account, type KyooError, User } from "~/models";
import { addAccount, removeAccounts } from "~/providers/account-store";
import { queryFn } from "~/query";

type Result<A, B> =
	| { ok: true; value: A; error?: undefined }
	| { ok: false; value?: undefined; error: B };

export const login = async (
	action: "register" | "login",
	{
		apiUrl,
		...body
	}: {
		login?: string;
		username?: string;
		password: string;
		email?: string;
		apiUrl: string | null;
	},
): Promise<Result<Account, string>> => {
	apiUrl ??= "";
	try {
		const controller = new AbortController();
		setTimeout(() => controller.abort(), 5_000);
		const { token } = await queryFn({
			method: "POST",
			url: `${apiUrl}/auth/${action === "login" ? "sessions" : "users"}`,
			body,
			authToken: null,
			signal: controller.signal,
			parser: z.object({ token: z.string() }),
		});
		const user = await queryFn({
			method: "GET",
			url: `${apiUrl}/auth/users/me`,
			authToken: token,
			parser: User,
		});
		const account: Account = { ...user, apiUrl, token, selected: true };
		addAccount(account);
		return { ok: true, value: account };
	} catch (e) {
		console.error(action, e);
		return { ok: false, error: (e as KyooError).message };
	}
};

// export const oidcLogin = async (
// 	provider: string,
// 	code: string,
// 	apiUrl?: string,
// ) => {
// 	if (!apiUrl || apiUrl.length === 0) apiUrl = getCurrentApiUrl()!;
// 	try {
// 		const token = await queryFn(
// 			{
// 				path: ["auth", "callback", provider, `?code=${code}`],
// 				method: "POST",
// 				authenticated: false,
// 				apiUrl,
// 			},
// 			TokenP,
// 		);
// 		const user = await queryFn(
// 			{ path: ["auth", "me"], method: "GET", apiUrl },
// 			UserP,
// 			`Bearer ${token.access_token}`,
// 		);
// 		const account: Account = { ...user, apiUrl: apiUrl, token, selected: true };
// 		addAccount(account);
// 		return { ok: true, value: account };
// 	} catch (e) {
// 		console.error("oidcLogin", e);
// 		return { ok: false, error: (e as KyooErrors).errors[0] };
// 	}
// };

export const logout = () => {
	removeAccounts((x) => x.selected);
};

export const deleteAccount = async () => {
	// await queryFn({
	// 	method: "DELETE",
	// 	url: "auth/users/me",
	// 	parser: null,
	// });
	logout();
};
