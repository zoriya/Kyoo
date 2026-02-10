import { useRouter } from "expo-router";
import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Platform } from "react-native";
import { A, Button, H1, Input, P } from "~/primitives";
import { defaultApiUrl } from "~/providers/account-provider";
import { useQueryState } from "~/utils";
import { FormPage } from "./form";
import { login } from "./logic";
import { PasswordInput } from "./password-input";
import { ServerUrlPage } from "./server-url";

export const RegisterPage = () => {
	const [apiUrl] = useQueryState("apiUrl", defaultApiUrl);
	const [email, setEmail] = useState("");
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [confirm, setConfirm] = useState("");
	const [error, setError] = useState<string | undefined>(undefined);

	const router = useRouter();
	const { t } = useTranslation();

	if (Platform.OS !== "web" && !apiUrl) return <ServerUrlPage />;

	return (
		<FormPage apiUrl={apiUrl!}>
			<H1 className="pb-4">{t("login.register")}</H1>
			<P className="pl-2">{t("login.username")}</P>
			<Input
				autoComplete="username"
				onChangeText={(value) => setUsername(value)}
			/>

			<P className="pt-2 pl-2">{t("login.email")}</P>
			<Input autoComplete="email" onChangeText={(value) => setEmail(value)} />

			<P className="pt-2 pl-2">{t("login.password")}</P>
			<PasswordInput
				autoComplete="new-password"
				onChangeText={(value) => setPassword(value)}
			/>

			<P className="pt-2 pl-2">{t("login.confirm")}</P>
			<PasswordInput
				autoComplete="new-password"
				onChangeText={(value) => setConfirm(value)}
			/>

			{password !== confirm && (
				<P className="text-red-500 dark:text-red-500">
					{t("login.password-no-match")}
				</P>
			)}
			{error && <P className="text-red-500 dark:text-red-500">{error}</P>}
			<Button
				text={t("login.register")}
				disabled={password !== confirm}
				onPress={async () => {
					const { error } = await login("register", {
						email,
						username,
						password,
						apiUrl,
					});
					setError(error);
					if (error) return;
					router.replace("/");
				}}
				className="m-2 my-6 w-60 self-center"
			/>
			<P>
				<Trans i18nKey="login.or-login">
					Have an account already?
					<A href={`/login?apiUrl=${apiUrl}`}>Log in</A>.
				</Trans>
			</P>
		</FormPage>
	);
};
