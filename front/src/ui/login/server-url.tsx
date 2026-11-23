import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Platform, View } from "react-native";
import { z } from "zod/v4";
import { useDLE } from "~/data";
import { RetryableError } from "~/models/retryable-error";
import { Button, H1, Input, Link, P } from "~/primitives";
import { useToken } from "~/providers/account-context";
import { defaultApiUrl } from "~/providers/account-provider";
import { storeValue, useStoreValue } from "~/providers/settings";
import { addGuestAccount } from "./logic";
import { OidcLogin } from "./oidc";

const LoginServer = z.string();

export const useLoginServer = () => {
	const server = useStoreValue("loginServer", LoginServer);
	if (Platform.OS === "web") return defaultApiUrl;
	return server ?? defaultApiUrl;
};

export const cleanApiUrl = (apiUrl: string) => {
	if (Platform.OS === "web") return undefined;
	if (!/https?:\/\//.test(apiUrl)) apiUrl = `http://${apiUrl}`;
	return apiUrl.replace(/\/$/, "");
};

export const ServerUrlPage = () => {
	const { apiUrl: current } = useToken();
	const server = useStoreValue("loginServer", LoginServer);
	const serverUrl = current || server;
	const [_apiUrl, setApiUrl] = useState(serverUrl ?? "");
	const apiUrl = cleanApiUrl(_apiUrl);
	const [resolvedUrl, setResolvedUrl] = useState<string | undefined>();
	const [error, setError] = useState<RetryableError | undefined>();
	useEffect(() => {
		setResolvedUrl(undefined);
		setError(undefined);
		if (!apiUrl) return;
		const controller = new AbortController();
		fetch(`${apiUrl}/api/health`, { signal: controller.signal })
			.then((resp) => setResolvedUrl(resp.url.replace("/api/health", "")))
			.catch((e) => {
				if (controller.signal.aborted) return;
				console.log("server select fetch error", e);
				setError(new RetryableError({ key: "offline" }));
			});
		return () => controller.abort();
	}, [apiUrl]);
	const { data: info } = useDLE(OidcLogin.query(resolvedUrl), {
		returnError: true,
	});
	const { t } = useTranslation();

	return (
		<View className="m-6 flex-1 justify-between">
			<H1>{t("login.server")}</H1>
			<View className="justify-center">
				<Input
					defaultValue={serverUrl}
					onChangeText={setApiUrl}
					autoCorrect={false}
					autoCapitalize="none"
					autoFocus={Platform.isTV}
				/>
				{!!_apiUrl && !resolvedUrl && (
					<P className="self-center text-red-500 dark:text-red-500">
						{error
							? error.message === "offline"
								? t("errors.invalid-server")
								: error.message
							: t("misc.loading")}
					</P>
				)}
			</View>
			<View className="mb-2">
				<View className="flex-row gap-4">
					<Button
						text={t("login.login")}
						as={Link}
						href="/login"
						onPress={() => storeValue("loginServer", resolvedUrl)}
						disabled={resolvedUrl == null}
						className="flex-1"
					/>
					<Button
						text={t("login.register")}
						as={Link}
						href="/register"
						onPress={() => storeValue("loginServer", resolvedUrl)}
						disabled={resolvedUrl == null}
						className="flex-1"
					/>
				</View>
				{info?.allowGuests && (
					<Button
						text={t("login.guest")}
						as={Link}
						href="/"
						replace
						onPress={() =>
							addGuestAccount(resolvedUrl!, info.guestClaims ?? {})
						}
						disabled={resolvedUrl == null}
						className="mt-4"
					/>
				)}
			</View>
			<View />
		</View>
	);
};
