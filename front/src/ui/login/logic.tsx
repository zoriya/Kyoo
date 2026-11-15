import { Platform } from "react-native";
import { z } from "zod/v4";
import { useMutation } from "~/data";
import { type Account, type KyooError, User } from "~/models";
import { RetryableError } from "~/models/retryable-error";
import { capitalize } from "~/primitives";
import { defaultApiUrl } from "~/providers/account-provider";
import {
	addAccount,
	readAccounts,
	removeAccounts,
} from "~/providers/account-store";

type Result<A, B> =
	| { ok: true; value: A; error?: undefined }
	| { ok: false; value?: undefined; error: B };

const Token = z.object({ token: z.string() });

// the web uses cookies, the apps name their session
export const device =
	Platform.OS === "web"
		? undefined
		: `${capitalize(Platform.OS)}${Platform.isTV ? " TV" : ""} App`;

const useAddAccount = () => {
	const { mutate: readUser } = useMutation(
		({ apiUrl, token }: { apiUrl: string; token: string }) => ({
			method: "GET",
			apiUrl,
			authToken: token,
			path: ["auth", "users", "me"],
			schema: User,
		}),
	);

	return async (apiUrl: string, token: string) => {
		const user = await readUser({ apiUrl, token });
		const account: Account = { ...user, apiUrl, token, selected: true };
		addAccount(account);
		return account;
	};
};

export const useLogin = () => {
	const { mutate: createSession } = useMutation(
		({
			action,
			apiUrl,
			signal,
			...body
		}: {
			action: "register" | "login";
			apiUrl: string;
			signal: AbortSignal;
			login?: string;
			username?: string;
			password: string;
			email?: string;
		}) => ({
			method: "POST",
			apiUrl,
			authToken: null,
			signal,
			path: ["auth", action === "login" ? "sessions" : "users"],
			params: { device },
			body,
		}),
	);
	const addAccount = useAddAccount();

	return async (
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
		apiUrl = apiUrl ?? defaultApiUrl;
		try {
			const controller = new AbortController();
			setTimeout(() => controller.abort(), 5_000);
			const { token } = Token.parse(
				await createSession({
					action,
					apiUrl,
					signal: controller.signal,
					...body,
				}),
			);
			const account = await addAccount(apiUrl, token);
			return { ok: true, value: account };
		} catch (e) {
			console.error(action, e);
			return {
				ok: false,
				error: ((e instanceof RetryableError && e.inner) || (e as KyooError))
					.message,
			};
		}
	};
};

export const useOidcLogin = () => {
	const { mutate: oidcCallback } = useMutation(
		({
			apiUrl,
			authToken,
			provider,
			code,
		}: {
			apiUrl: string;
			authToken: string | null;
			provider: string;
			code: string;
		}) => ({
			method: "GET",
			apiUrl,
			authToken,
			path: ["auth", "oidc", "callback", provider],
			params: { token: code, device },
		}),
	);
	const addAccount = useAddAccount();

	return async (
		provider: string,
		code: string,
		linkToToken: string | null,
		apiUrl?: string,
	): Promise<Result<Account | null, string>> => {
		apiUrl = apiUrl ?? defaultApiUrl;
		try {
			const ret = await oidcCallback({
				apiUrl,
				authToken: linkToToken,
				provider,
				code,
			});
			if (linkToToken) return { ok: true, value: null };
			const { token } = Token.parse(ret);
			const account = await addAccount(apiUrl, token);
			return { ok: true, value: account };
		} catch (e) {
			console.error("oidcLogin", e);
			return {
				ok: false,
				error: ((e instanceof RetryableError && e.inner) || (e as KyooError))
					.message,
			};
		}
	};
};

export const useDeviceLogin = () => {
	const { mutate: approveDevice } = useMutation(
		({ apiUrl, deviceCode }: { apiUrl: string; deviceCode: string }) => ({
			method: "DELETE",
			apiUrl,
			authToken: null,
			path: ["auth", "device"],
			params: { device },
			body: { deviceCode },
		}),
	);
	const addAccount = useAddAccount();

	return async (
		deviceCode: string,
		apiUrl: string,
	): Promise<Result<Account | null, KyooError>> => {
		try {
			const { token } = Token.parse(
				await approveDevice({ apiUrl, deviceCode }),
			);
			return { ok: true, value: await addAccount(apiUrl, token) };
		} catch (e) {
			// the user has not yet approved the login
			if ((e as KyooError).status === 428) return { ok: true, value: null };
			console.error("deviceLogin", e);
			return { ok: false, error: e as KyooError };
		}
	};
};

export const useLogout = () => {
	const { mutate: deleteSession } = useMutation(
		({ apiUrl, token }: { apiUrl: string; token: string }) => ({
			method: "DELETE",
			apiUrl,
			authToken: token,
			path: ["auth", "sessions", "current"],
		}),
	);

	return async (id?: string) => {
		const accounts = readAccounts();
		const account = accounts.find((x) => (id ? x.id === id : x.selected));
		removeAccounts((x) => x.id === account?.id);
		if (!account) return;
		try {
			await deleteSession({ apiUrl: account.apiUrl, token: account.token });
		} catch (e) {
			console.error(e, "continuing normaly");
		}
	};
};

export const useDeleteAccount = () => {
	const { mutate: deleteUser } = useMutation(
		({ apiUrl, token }: { apiUrl: string; token: string }) => ({
			method: "DELETE",
			apiUrl,
			authToken: token,
			path: ["auth", "users", "me"],
		}),
	);

	return async () => {
		const account = readAccounts().find((x) => x.selected);
		if (account)
			await deleteUser({ apiUrl: account.apiUrl, token: account.token });
		removeAccounts((x) => x.selected);
	};
};
