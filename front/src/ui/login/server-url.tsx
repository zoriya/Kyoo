import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Platform, View } from "react-native";
import { RetryableError } from "~/models/retryable-error";
import { Button, H1, Input, Link, P, preferFocus } from "~/primitives";

export const cleanApiUrl = (apiUrl: string) => {
	if (Platform.OS === "web") return undefined;
	if (!/https?:\/\//.test(apiUrl)) apiUrl = `http://${apiUrl}`;
	return apiUrl.replace(/\/$/, "");
};

export const ServerUrlPage = () => {
	const [_apiUrl, setApiUrl] = useState("");
	const apiUrl = cleanApiUrl(_apiUrl);
	const { data, error } = useQuery({
		queryKey: [apiUrl, "api", "health"],
		// an empty field is not a server: `cleanApiUrl` turns it into `http:/`,
		// which resolves to a host called "api" and fails, so the screen opened
		// telling you it could not reach kyoo before you had typed anything.
		enabled: !!_apiUrl,
		queryFn: async (ctx) => {
			try {
				const resp = await fetch(`${apiUrl}/api/health`, {
					method: "GET",
					signal: ctx.signal,
				});
				return resp.url.replace("/api/health", "");
			} catch (e) {
				console.log("server select fetch error", e);
				throw new RetryableError({
					key: "offline",
				});
			}
		},
	});
	const { t } = useTranslation();

	return (
		<View className="m-6 flex-1 justify-between">
			<H1>{t("login.server")}</H1>
			<View className="justify-center">
				<Input
					onChangeText={setApiUrl}
					autoCorrect={false}
					autoCapitalize="none"
					{...preferFocus()}
				/>
				{!!_apiUrl && !data && (
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
						href={`/login?apiUrl=${data}`}
						disabled={data == null}
						className="flex-1"
					/>
					<Button
						text={t("login.register")}
						as={Link}
						href={`/register?apiUrl=${data}`}
						disabled={data == null}
						className="flex-1"
					/>
				</View>
			</View>
			<View />
		</View>
	);
};
