import ArrowBack from "@material-symbols/svg-400/rounded/arrow_back-fill.svg";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { View, type ViewProps } from "react-native";
import type { KImage } from "~/models";
import {
	H1,
	IconButton,
	Image,
	PressableFeedback,
	Skeleton,
	tooltip,
} from "~/primitives";
import { cn } from "~/utils";

export const Back = ({
	name,
	kind,
	logo,
	showHref,
	className,
	...props
}: {
	showHref?: string;
	name?: string;
	kind?: "movie" | "serie" | "collection";
	logo?: KImage | null;
} & ViewProps) => {
	const { t } = useTranslation();
	const router = useRouter();

	return (
		<View className={cn("flex-row items-center", className)} {...props}>
			<IconButton
				icon={ArrowBack}
				as={PressableFeedback}
				onPress={() => {
					if (router.canGoBack()) router.back();
					else if (showHref) router.replace(showHref);
				}}
				className="my-4 ml-4"
				iconClassName="fill-slate-200"
				{...tooltip(t("player.back"))}
			/>
			{kind === "movie" && logo ? (
				<Image
					src={logo}
					quality="high"
					alt={name ?? "movie"}
					contentFit="contain"
					className="my-4 ml-4 h-8 w-36 rounded-none bg-transparent"
				/>
			) : name ? (
				<H1 className="my-4 ml-4 text-2xl text-slate-200">{name}</H1>
			) : (
				<Skeleton className="my-4 w-20" />
			)}
		</View>
	);
};
