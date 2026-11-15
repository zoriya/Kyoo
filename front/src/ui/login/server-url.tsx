import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Platform, View } from "react-native";
import { RetryableError } from "~/models/retryable-error";
import { Button, H1, Input, Link, P } from "~/primitives";

export const cleanApiUrl = (apiUrl: string) => {
	if (Platform.OS === "web") return undefined;
	if (!/https?:\/\//.test(apiUrl)) apiUrl = `http://${apiUrl}`;
	return apiUrl.replace(/\/$/, "");
};

export const ServerUrlPage = () => {
	const { serverUrl } = useLocalSearchParams<{ serverUrl?: string }>();
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
						href={`/login?apiUrl=${resolvedUrl}`}
						disabled={resolvedUrl == null}
						className="flex-1"
					/>
					<Button
						text={t("login.register")}
						as={Link}
						href={`/register?apiUrl=${resolvedUrl}`}
						disabled={resolvedUrl == null}
						className="flex-1"
					/>
				</View>
			</View>
			<View />
		</View>
	);
};
