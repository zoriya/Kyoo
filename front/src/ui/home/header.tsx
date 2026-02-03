import Info from "@material-symbols/svg-400/rounded/info.svg";
import PlayArrow from "@material-symbols/svg-400/rounded/play_arrow-fill.svg";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { min, percent, px, rem, vh } from "yoshiki/native";
import { type KImage, Show } from "~/models";
import {
	ContrastArea,
	H1,
	H2,
	IconButton,
	IconFab,
	ImageBackground,
	Link,
	P,
	Skeleton,
	tooltip,
	ts,
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
	className?: string;
}) => {
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
		<ContrastArea mode="dark">
			{({ css, theme }) => (
				<View
					{...css({
						flexDirection: "column-reverse",
						width: percent(100),
						height: {
							xs: vh(40),
							sm: min(vh(60), px(750)),
							md: min(vh(60), px(680)),
							lg: vh(65),
						},
						minHeight: {
							xs: px(350),
							sm: px(300),
							md: px(400),
							lg: px(600),
						},
					})}
				>
					<LinearGradient
						start={{ x: 0, y: 0.25 }}
						end={{ x: 0, y: 1 }}
						colors={["transparent", theme.darkOverlay]}
						{...(css({
							position: "absolute",
							top: 0,
							bottom: 0,
							left: 0,
							right: 0,
						}) as any)}
					/>
					<View {...css({ margin: ts(2) })}>
						<Skeleton {...css({ width: rem(8), height: rem(2.5) })} />
						<View {...css({ flexDirection: "row", alignItems: "center" })}>
							<IconFab
								icon={PlayArrow}
								aria-label={t("show.play")}
								{...tooltip(t("show.play"))}
								{...css({ marginRight: ts(1) })}
							/>
							<IconButton
								icon={Info}
								aria-label={t("home.info")}
								{...tooltip(t("home.info"))}
								{...css({ marginRight: ts(2) })}
							/>
							<Skeleton
								{...css({
									width: rem(25),
									height: rem(2),
									display: { xs: "none", sm: "flex" },
								})}
							/>
						</View>
						<Skeleton
							lines={4}
							{...css({
								display: { xs: "none", md: "flex" },
								marginTop: ts(1),
							})}
						/>
					</View>
				</View>
			)}
		</ContrastArea>
	);
};

Header.query = (): QueryIdentifier<Show> => ({
	parser: Show,
	path: ["api", "shows", "random"],
	params: {
		with: ["firstEntry"],
	},
});
