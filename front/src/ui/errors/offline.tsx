import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useYoshiki } from "yoshiki/native";
import { P } from "~/primitives";

export const OfflineView = () => {
	const { css } = useYoshiki();
	const { t } = useTranslation();

	return (
		<View
			{...css({
				flexGrow: 1,
				flexShrink: 1,
				justifyContent: "center",
				alignItems: "center",
			})}
		>
			<P {...css({ color: (theme) => theme.colors.white })}>
				{t("errors.offline")}
			</P>
		</View>
	);
};
