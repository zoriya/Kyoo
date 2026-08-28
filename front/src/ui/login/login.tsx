import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Platform } from "react-native";
import { A, Button, H1, Input, P, preferFocus } from "~/primitives";
import { defaultApiUrl } from "~/providers/account-provider";
import { useFetch } from "~/query";
import { useQueryState } from "~/utils";
import { FormPage } from "./form";
import { login } from "./logic";
import { OidcLogin } from "./oidc";
import { PasswordInput } from "./password-input";
import { ServerUrlPage } from "./server-url";

export const LoginPage = () => {
	const [apiUrl] = useQueryState("apiUrl", defaultApiUrl);
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const params = useLocalSearchParams();
	const [error, setError] = useState(params.error as string | undefined);

	const { t } = useTranslation();
	const router = useRouter();
	const { data: info } = useFetch(OidcLogin.query(apiUrl));

	if (Platform.OS !== "web" && !apiUrl) return <ServerUrlPage />;

	return (
		<FormPage apiUrl={apiUrl!}>
			<H1 className="pb-4">{t("login.login")}</H1>
			<OidcLogin apiUrl={apiUrl} />
			<P className="pl-2">{t("login.username")}</P>
			<Input
				autoComplete="username"
				onChangeText={(value) => setUsername(value)}
				autoCapitalize="none"
				// the only thing to do on this screen is fill it in, and a remote has
				// no way of reaching it other than being put there — unless there is a
				// provider button above, which is the shorter way in.
				{...preferFocus(!Object.keys(info?.oidc ?? {}).length)}
			/>
			<P className="pt-2 pl-2">{t("login.password")}</P>
			<PasswordInput
				autoComplete="password"
				onChangeText={(value) => setPassword(value)}
			/>
			{error && <P className="text-red-500 dark:text-red-500">{error}</P>}
			<Button
				text={t("login.login")}
				onPress={async () => {
					const { error } = await login("login", {
						login: username,
						password,
						apiUrl,
					});
					setError(error);
					if (error) return;
					router.replace("/");
				}}
				className="m-2 my-6 w-60 self-center"
			/>
			{info?.allowRegister !== false && (
				<P>
					<Trans i18nKey="login.or-register">
						Don’t have an account?
						<A href={`/register?apiUrl=${apiUrl}`}>Register</A>.
					</Trans>
				</P>
			)}
		</FormPage>
	);
};
