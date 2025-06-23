import { useRouter } from "expo-router";
import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Platform } from "react-native";
import { percent, px, useYoshiki } from "yoshiki/native";
import { A, Button, H1, Input, P, ts } from "~/primitives";
import { useQueryState } from "~/utils";
import { FormPage } from "./form";
import { login } from "./logic";
import { PasswordInput } from "./password-input";
import { ServerUrlPage } from "./server-url";

export const RegisterPage = () => {
	const [apiUrl] = useQueryState("apiUrl", null);
	const [email, setEmail] = useState("");
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [confirm, setConfirm] = useState("");
	const [error, setError] = useState<string | undefined>(undefined);

	const router = useRouter();
	const { t } = useTranslation();
	const { css } = useYoshiki();

	if (Platform.OS !== "web" && !apiUrl) return <ServerUrlPage />;

	return (
		<FormPage apiUrl={apiUrl!}>
			<H1>{t("login.register")}</H1>
			{/* <OidcLogin apiUrl={apiUrl} hideOr={!data?.passwordLoginEnabled} /> */}
			{/* {data?.registrationEnabled && ( */}
			{/* 	<> */}
			<P {...(css({ paddingLeft: ts(1) }) as any)}>{t("login.username")}</P>
			<Input
				autoComplete="username"
				variant="big"
				onChangeText={(value) => setUsername(value)}
			/>

			<P {...(css({ paddingLeft: ts(1) }) as any)}>{t("login.email")}</P>
			<Input
				autoComplete="email"
				variant="big"
				onChangeText={(value) => setEmail(value)}
			/>

			<P {...(css({ paddingLeft: ts(1) }) as any)}>{t("login.password")}</P>
			<PasswordInput
				autoComplete="password-new"
				variant="big"
				onChangeText={(value) => setPassword(value)}
			/>

			<P {...(css({ paddingLeft: ts(1) }) as any)}>{t("login.confirm")}</P>
			<PasswordInput
				autoComplete="password-new"
				variant="big"
				onChangeText={(value) => setConfirm(value)}
			/>

			{password !== confirm && (
				<P {...css({ color: (theme) => theme.colors.red })}>
					{t("login.password-no-match")}
				</P>
			)}
			{error && <P {...css({ color: (theme) => theme.colors.red })}>{error}</P>}
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
				{...css({
					m: ts(1),
					width: px(250),
					maxWidth: percent(100),
					alignSelf: "center",
					mY: ts(3),
				})}
			/>
			{/* 	</> */}
			{/* )} */}
			<P>
				<Trans i18nKey="login.or-login">
					Have an account already?{" "}
					<A href={`/login?apiUrl=${apiUrl}`}>Log in</A>.
				</Trans>
			</P>
		</FormPage>
	);
};
