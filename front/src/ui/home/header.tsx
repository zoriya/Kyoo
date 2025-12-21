import Info from "@material-symbols/svg-400/rounded/info.svg";
import PlayArrow from "@material-symbols/svg-400/rounded/play_arrow-fill.svg";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { min, percent, px, rem, useYoshiki, vh } from "yoshiki/native";
import { type KImage, Show } from "~/models";
import {
	ContrastArea,
	GradientImageBackground,
	H1,
	H2,
	IconButton,
	IconFab,
	Link,
	P,
	Skeleton,
	tooltip,
	ts,
} from "~/primitives";
import type { QueryIdentifier } from "~/query";

export const Header = ({
	name,
	thumbnail,
	description,
	tagline,
	link,
	infoLink,
	...props
}: {
	name: string;
	thumbnail: KImage | null;
	description: string | null;
	tagline: string | null;
	link: string | null;
	infoLink: string;
}) => {
	const { t } = useTranslation();

	return (
		<ContrastArea mode="dark">
			{({ css }) => (
				<GradientImageBackground
					src={thumbnail}
					alt=""
					quality="high"
					layout={{
						width: percent(100),
						height: {
							xs: vh(40),
							sm: min(vh(60), px(750)),
							md: min(vh(60), px(680)),
							lg: vh(65),
						},
					}}
					{...(css(
						{
							minHeight: {
								xs: px(350),
								sm: px(300),
								md: px(400),
								lg: px(600),
							},
						},
						props,
					) as any)}
				>
					<View
						{...css({
							width: { md: percent(70) },
							position: "absolute",
							bottom: 0,
							margin: ts(2),
						})}
					>
						<H1
							numberOfLines={4}
							{...css({ fontSize: { xs: rem(2), sm: rem(3) } })}
						>
							{name}
						</H1>
						<View {...css({ flexDirection: "row", alignItems: "center" })}>
							{link !== null && (
								<IconFab
									icon={PlayArrow}
									aria-label={t("show.play")}
									as={Link}
									href={link ?? "#"}
									{...tooltip(t("show.play"))}
									{...css({ marginRight: ts(1) })}
								/>
							)}
							<IconButton
								icon={Info}
								as={Link}
								aria-label={t("home.info")}
								href={infoLink ?? "#"}
								{...tooltip(t("home.info"))}
								{...css({ marginRight: ts(2) })}
							/>
							{tagline && (
								<H2 {...css({ display: { xs: "none", sm: "flex" } })}>
									{tagline}
								</H2>
							)}
						</View>
						<P
							numberOfLines={4}
							{...css({ display: { xs: "none", md: "flex" } })}
						>
							{description}
						</P>
					</View>
				</GradientImageBackground>
			)}
		</ContrastArea>
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
