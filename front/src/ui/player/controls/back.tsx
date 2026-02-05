import ArrowBack from "@material-symbols/svg-400/rounded/arrow_back-fill.svg";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { View, type ViewProps } from "react-native";
import {
	H1,
	IconButton,
	PressableFeedback,
	Skeleton,
	tooltip,
} from "~/primitives";
import { cn } from "~/utils";

export const Back = ({
	name,
	showHref,
	className,
	...props
}: { showHref?: string; name?: string } & ViewProps) => {
	const { t } = useTranslation();
	const router = useRouter();

	return (
		<View className={cn("flex-row items-center", className)} {...props}>
			<IconButton
				icon={ArrowBack}
				as={PressableFeedback}
				onPress={() => {
					if (router.canGoBack()) router.back();
					else if (showHref) router.navigate(showHref);
				}}
				className="my-4 ml-4"
				iconClassName="fill-slate-200"
				{...tooltip(t("player.back"))}
			/>
			{name ? (
				<H1 className="my-4 ml-4 text-2xl text-slate-200">{name}</H1>
			) : (
				<Skeleton className="my-4 w-20" />
			)}
		</View>
	);
};
