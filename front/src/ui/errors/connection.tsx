import { ConnectionErrorContext, useAccount } from "@kyoo/models";
import { Button, H1, Icon, Link, P, ts } from "@kyoo/primitives";
import Register from "@material-symbols/svg-400/rounded/app_registration.svg";
import { useContext } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useRouter } from "solito/router";
import { useYoshiki } from "yoshiki/native";
import { DefaultLayout } from "../../../packages/ui/src/layout";

export const ConnectionError = () => {
	const { css } = useYoshiki();
	const { t } = useTranslation();
	const router = useRouter();
	const { error, retry } = useContext(ConnectionErrorContext);
	const account = useAccount();

	if (error && (error.status === 401 || error.status === 403)) {
		if (!account) {
			return (
				<View
					{...css({ flexGrow: 1, flexShrink: 1, justifyContent: "center", alignItems: "center" })}
				>
					<P>{t("errors.needAccount")}</P>
					<Button
						as={Link}
						href={"/register"}
						text={t("login.register")}
						licon={<Icon icon={Register} {...css({ marginRight: ts(2) })} />}
					/>
				</View>
			);
		}
		if (!account.isVerified) {
			return (
				<View
					{...css({ flexGrow: 1, flexShrink: 1, justifyContent: "center", alignItems: "center" })}
				>
					<P>{t("errors.needVerification")}</P>
				</View>
			);
		}
	}
	return (
		<View {...css({ padding: ts(2) })}>
			<H1 {...css({ textAlign: "center" })}>{t("errors.connection")}</H1>
			<P>{error?.errors[0] ?? t("errors.unknown")}</P>
			<P>{t("errors.connection-tips")}</P>
			<Button onPress={retry} text={t("errors.try-again")} {...css({ m: ts(1) })} />
			<Button
				onPress={() => router.push("/login")}
				text={t("errors.re-login")}
				{...css({ m: ts(1) })}
			/>
		</View>
	);
};

ConnectionError.getLayout = DefaultLayout;
