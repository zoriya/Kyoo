import { type ReactNode, useContext } from "react";
import { useTranslation } from "react-i18next";
import { Platform, View } from "react-native";
import { Button, Link, P } from "~/primitives";
import { AccountsContext } from "~/providers/account-context";

export const NeedPermission = ({
	permission,
	children,
}: {
	permission?: string;
	children: ReactNode;
}) => {
	const { t } = useTranslation();
	const account = useContext(AccountsContext).selectedAccount;
	const allowed = permission
		? account?.claims.permissions.includes(permission)
		: account && !account.guest;
	if (allowed) return children;

	const needAccount = !account || account.guest;
	return (
		<View className="flex-1 items-center justify-center p-4">
			<P className="text-center">
				{needAccount
					? t("errors.needAccount")
					: t("errors.unauthorized", { permission })}
			</P>
			{needAccount && (
				<Button
					as={Link}
					href={Platform.OS === "web" ? "/login" : "/server"}
					text={t("login.login")}
					className="m-4 min-w-md"
				/>
			)}
		</View>
	);
};
