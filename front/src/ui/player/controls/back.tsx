import ArrowBack from "@material-symbols/svg-400/rounded/arrow_back-fill.svg";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { View, type ViewProps } from "react-native";
import { percent, rem, useYoshiki } from "yoshiki/native";
import {
	H1,
	IconButton,
	PressableFeedback,
	Skeleton,
	tooltip,
} from "~/primitives";

export const Back = ({
	name,
	showHref,
	...props
}: { showHref?: string; name?: string } & ViewProps) => {
	const { css } = useYoshiki();
	const { t } = useTranslation();
	const router = useRouter();

	return (
		<View
			{...css(
				{
					display: "flex",
					flexDirection: "row",
					alignItems: "center",
					padding: percent(0.33),
					color: "white",
				},
				props,
			)}
		>
			<IconButton
				icon={ArrowBack}
				as={PressableFeedback}
				onPress={() => {
					if (router.canGoBack()) router.back();
					else if (showHref) router.navigate(showHref);
				}}
				{...tooltip(t("player.back"))}
			/>
			{name ? (
				<H1
					{...css({
						alignSelf: "center",
						fontSize: rem(1.5),
						marginLeft: rem(1),
					})}
				>
					{name}
				</H1>
			) : (
				<Skeleton {...css({ width: rem(5) })} />
			)}
		</View>
	);
};
