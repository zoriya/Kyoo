import Info from "@material-symbols/svg-400/rounded/info.svg";
import PlayArrow from "@material-symbols/svg-400/rounded/play_arrow-fill.svg";
import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { type KImage, Show } from "~/models";
import {
	H1,
	H2,
	IconButton,
	IconFab,
	ImageBackground,
	Link,
	P,
	Skeleton,
	tooltip,
} from "~/primitives";
import type { QueryIdentifier } from "~/query";
import { cn } from "~/utils";

export const Header = ({
	name,
	thumbnail,
	description,
	tagline,
	link,
	infoLink,
	className,
	...props
}: {
	name: string;
	thumbnail: KImage | null;
	description: string | null;
	tagline: string | null;
	link: string | null;
	infoLink: string;
} & Partial<ComponentProps<typeof ImageBackground>>) => {
	const { t } = useTranslation();

	return (
		<ImageBackground
			src={thumbnail}
			alt=""
			quality="high"
			className={cn(
				"h-[40vh] w-full sm:h-[60vh] sm:min-h-[750px] md:min-h-[680px] lg:h-[65vh]",
				className,
			)}
			{...props}
		>
			<View className="absolute inset-0 bg-linear-to-b from-transparent to-slate-950/70" />
			<View className="absolute bottom-0 m-4 md:w-3/5">
				<H1 numberOfLines={4} className="text-3xl text-slate-200 sm:text-5xl">
					{name}
				</H1>
				<View className="my-2 flex-row items-center">
					{link !== null && (
						<IconFab
							icon={PlayArrow}
							aria-label={t("show.play")}
							as={Link}
							href={link}
							className="mr-2"
							{...tooltip(t("show.play"))}
						/>
					)}
					<IconButton
						icon={Info}
						as={Link}
						aria-label={t("home.info")}
						href={infoLink}
						className="mr-2"
						iconClassName="fill-slate-400"
						{...tooltip(t("home.info"))}
					/>
					{tagline && (
						<H2 className="text-slate-200 max-sm:hidden">{tagline}</H2>
					)}
				</View>
				<P numberOfLines={4} className="text-slate-400 max-sm:hidden">
					{description}
				</P>
			</View>
		</ImageBackground>
	);
};

Header.Loader = () => {
	const { t } = useTranslation();

	return (
		<View
			className={cn(
				"h-[40vh] w-full sm:h-[60vh] sm:min-h-[750px] md:min-h-[680px] lg:h-[65vh]",
			)}
		>
			<View className="absolute inset-0 bg-linear-to-b from-transparent to-slate-950/70" />
			<View className="absolute bottom-0 m-4 md:w-3/5">
				<Skeleton className="h-10 w-2/5" />
				<View className="my-2 flex-row items-center">
					<IconFab
						icon={PlayArrow}
						disabled
						aria-label={t("show.play")}
						className="mr-2"
						{...tooltip(t("show.play"))}
					/>
					<IconButton
						icon={Info}
						disabled
						aria-label={t("home.info")}
						className="mr-2"
						iconClassName="fill-slate-400"
						{...tooltip(t("home.info"))}
					/>
					<Skeleton className="h-8 w-4/5 max-sm:hidden" />
				</View>
				<Skeleton lines={4} className="max-sm:hidden" />
			</View>
		</View>
	);
};

Header.query = (): QueryIdentifier<Show> => ({
	parser: Show,
	path: ["api", "shows", "random"],
	params: {
		with: ["firstEntry"],
	},
});
