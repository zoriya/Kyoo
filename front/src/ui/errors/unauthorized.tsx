import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useYoshiki } from "yoshiki/native";
import { P } from "~/primitives";

export const Unauthorized = ({ missing }: { missing: string[] }) => {
	const { t } = useTranslation();
	const { css } = useYoshiki();

	return (
		<View
			{...css({
				flexGrow: 1,
				flexShrink: 1,
				justifyContent: "center",
				alignItems: "center",
			})}
		>
			<P>{t("errors.unauthorized", { permission: missing?.join(", ") })}</P>
		</View>
	);
};
