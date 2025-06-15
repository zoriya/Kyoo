import { type Account, type KyooErrors, TokenP, UserP, getCurrentApiUrl } from "~/models";
import { addAccount, removeAccounts } from "~/providers/account-store";
import { queryFn } from "~/query";

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
		const user = await queryFn({
			method: "GET",
			path: ["auth", "me"],
			apiUrl,
			authToken: token.access_token,
			parser: UserP,
		});
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

export const logout = () => {
	removeAccounts((x) => x.selected);
};

export const deleteAccount = async () => {
	await queryFn({ path: ["auth", "me"], method: "DELETE" });
	logout();
};
