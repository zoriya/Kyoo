import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Platform, View } from "react-native";
import { Button, H1, Input, Link, P } from "~/primitives";
import { type QueryIdentifier, useFetch } from "~/query";

export const cleanApiUrl = (apiUrl: string) => {
	if (Platform.OS === "web") return undefined;
	if (!/https?:\/\//.test(apiUrl)) apiUrl = `http://${apiUrl}`;
	return apiUrl.replace(/\/$/, "");
};

export const ServerUrlPage = () => {
	const [_apiUrl, setApiUrl] = useState("");
	const apiUrl = cleanApiUrl(_apiUrl);
	const { data, error } = useFetch({
		...ServerUrlPage.query,
		options: { apiUrl, authToken: null, returnError: true },
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
				/>
				{!data && (
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
						href={`/login?apiUrl=${apiUrl}`}
						disabled={data == null}
						className="flex-1"
					/>
					<Button
						text={t("login.register")}
						as={Link}
						href={`/register?apiUrl=${apiUrl}`}
						disabled={data == null}
						className="flex-1"
					/>
				</View>
			</View>
			<View />
		</View>
	);
};

ServerUrlPage.query = {
	path: ["api", "health"],
	parser: null,
} satisfies QueryIdentifier;
