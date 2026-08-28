import { useRouter } from "expo-router";
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

export const RegisterPage = () => {
	const [apiUrl] = useQueryState("apiUrl", defaultApiUrl);
	const [email, setEmail] = useState("");
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [confirm, setConfirm] = useState("");
	const [error, setError] = useState<string | undefined>(undefined);

	const router = useRouter();
	const { t } = useTranslation();
	const { data: info } = useFetch({
		...OidcLogin.query(apiUrl),
		options: { returnError: true },
	});

	if (Platform.OS !== "web" && !apiUrl) return <ServerUrlPage />;
	if (info?.allowRegister === false) {
		return (
			<FormPage apiUrl={apiUrl!}>
				<OidcLogin apiUrl={apiUrl} />
				<H1 className="pb-4">{t("login.register")}</H1>
				<P className="mb-6">
					{t(
						Object.values(info.oidc).length > 0
							? "login.register-disabled-oidc"
							: "login.register-disabled",
					)}
				</P>
				<P>
					<Trans i18nKey="login.or-login">
						Have an account already?
						<A href={`/login?apiUrl=${apiUrl}`}>Log in</A>.
					</Trans>
				</P>
			</FormPage>
		);
	}

	return (
		<FormPage apiUrl={apiUrl!}>
			<H1 className="pb-4">{t("login.register")}</H1>
			<OidcLogin apiUrl={apiUrl} />
			<P className="pl-2">{t("login.username")}</P>
			<Input
				autoComplete="username"
				onChangeText={(value) => setUsername(value)}
				// the only thing to do on this screen is fill it in, and a remote has
				// no way of reaching it other than being put there — unless there is a
				// provider button above, which is the shorter way in.
				{...preferFocus(!Object.keys(info?.oidc ?? {}).length)}
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
