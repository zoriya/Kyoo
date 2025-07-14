import Register from "@material-symbols/svg-400/rounded/app_registration.svg";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useYoshiki } from "yoshiki/native";
import { Button, Icon, Link, P, ts } from "~/primitives";
import { useAccount } from "~/providers/account-context";

export const Unauthorized = ({ missing }: { missing: string[] }) => {
	const { t } = useTranslation();
	const { css } = useYoshiki();
	const account = useAccount();

	if (!account) {
		return (
			<View
				{...css({
					flexGrow: 1,
					flexShrink: 1,
					justifyContent: "center",
					alignItems: "center",
				})}
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
				{...css({
					flexGrow: 1,
					flexShrink: 1,
					justifyContent: "center",
					alignItems: "center",
				})}
			>
				<P>{t("errors.needVerification")}</P>
			</View>
		);
	}

	return (
		<View
			{...css({
				flexGrow: 1,
				flexShrink: 1,
				justifyContent: "center",
				alignItems: "center",
			})}
		>
			<P>
				{t("errors.unauthorized", { permission: missing?.join(", ") ?? "" })}
			</P>
		</View>
	);
};
