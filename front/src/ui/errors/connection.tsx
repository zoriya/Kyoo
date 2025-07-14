import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useYoshiki } from "yoshiki/native";
import type { KyooError } from "~/models";
import { Button, H1, Link, P, ts } from "~/primitives";

export const ConnectionError = ({
	error,
	retry,
}: {
	error: KyooError;
	retry: () => void;
}) => {
	const { css } = useYoshiki();
	const { t } = useTranslation();

	return (
		<View {...css({ padding: ts(2) })}>
			<H1 {...css({ textAlign: "center" })}>{t("errors.connection")}</H1>
			<P>{error?.message ?? t("errors.unknown")}</P>
			<P>{t("errors.connection-tips")}</P>
			<Button
				onPress={retry}
				text={t("errors.try-again")}
				{...css({ m: ts(1) })}
			/>
			<Button
				as={Link}
				href="/login"
				text={t("errors.re-login")}
				{...css({ m: ts(1) })}
			/>
		</View>
	);
};
