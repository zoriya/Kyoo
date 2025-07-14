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

export const LoginPage = () => {
	const [apiUrl] = useQueryState("apiUrl", null);
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | undefined>();

	const { t } = useTranslation();
	const { css } = useYoshiki();
	const router = useRouter();

	if (Platform.OS !== "web" && !apiUrl) return <ServerUrlPage />;

	return (
		<FormPage apiUrl={apiUrl!}>
			<H1>{t("login.login")}</H1>
			{/* <OidcLogin apiUrl={apiUrl} hideOr={!data?.passwordLoginEnabled} /> */}
			{/* {data?.passwordLoginEnabled && ( */}
			{/* 	<> */}
			<P {...(css({ paddingLeft: ts(1) }) as any)}>{t("login.username")}</P>
			<Input
				autoComplete="username"
				variant="big"
				onChangeText={(value) => setUsername(value)}
				autoCapitalize="none"
			/>
			<P {...(css({ paddingLeft: ts(1) }) as any)}>{t("login.password")}</P>
			<PasswordInput
				autoComplete="password"
				variant="big"
				onChangeText={(value) => setPassword(value)}
			/>
			{error && <P {...css({ color: (theme) => theme.colors.red })}>{error}</P>}
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
				<Trans i18nKey="login.or-register">
					Don’t have an account?{" "}
					<A href={`/register?apiUrl=${apiUrl}`}>Register</A>.
				</Trans>
			</P>
		</FormPage>
	);
};
