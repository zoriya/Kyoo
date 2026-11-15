import Info from "@material-symbols/svg-400/rounded/info.svg";
import PlayArrow from "@material-symbols/svg-400/rounded/play_arrow-fill.svg";
import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { Platform, View } from "react-native";
import type { QueryIdentifier } from "~/data";
import { Show } from "~/models";
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
import { cn } from "~/utils";
import { useHeroHeight } from "../hero";

export const Header = ({
	name,
	description,
	tagline,
	thumbnail,
	href,
	playHref,
	className,
	...props
}: {
	name: string;
	description: string | null;
	tagline: string | null;
	thumbnail: Show["thumbnail"];
	href: string;
	playHref: string | null;
} & Partial<ComponentProps<typeof ImageBackground>>) => {
	const { t } = useTranslation();
	const height = useHeroHeight();

	return (
		<ImageBackground
			src={thumbnail}
			alt=""
			quality="high"
			className={cn("w-full", className)}
			style={{ height }}
			{...props}
		>
			<View className="absolute inset-0 bg-linear-to-b from-transparent to-slate-950/70" />
			<View className="absolute bottom-0 m-4 md:w-3/5">
				<H1 numberOfLines={4} className="text-3xl text-slate-200 sm:text-5xl">
					{name}
				</H1>
				<View className="my-2 flex-row items-center">
					{playHref && (
						<IconFab
							icon={PlayArrow}
							as={Link}
							href={playHref}
							aria-label={t("show.play")}
							className="mr-2"
							{...tooltip(t("show.play"))}
						/>
					)}
					<IconButton
						icon={Info}
						as={Link}
						href={href}
						disabled={Platform.isTV ? false : undefined}
						aria-label={t("home.info")}
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

Header.Loader = ({
	className,
	...props
}: Partial<ComponentProps<typeof ImageBackground>>) => {
	const { t } = useTranslation();
	const height = useHeroHeight();

	return (
		<ImageBackground
			src={null}
			alt=""
			quality="high"
			className={cn("w-full", className)}
			style={{ height }}
			{...props}
		>
			<View className="absolute inset-0 bg-linear-to-b from-transparent to-slate-950/70" />
			<View className="absolute bottom-0 m-4 md:w-3/5">
				<Skeleton className="h-10 w-2/5" />
				<View className="my-2 flex-row items-center">
					<IconFab
						icon={PlayArrow}
						as={Link}
						href={null}
						// tv can't focus a disabled button, we want default focus to be on the play button.
						disabled={Platform.isTV ? false : undefined}
						aria-label={t("show.play")}
						className="mr-2"
						{...tooltip(t("show.play"))}
					/>
					<IconButton
						icon={Info}
						as={Link}
						href={undefined}
						disabled={Platform.isTV ? false : undefined}
						aria-label={t("home.info")}
						className="mr-2"
						iconClassName="fill-slate-400"
						{...tooltip(t("home.info"))}
					/>
					<Skeleton className="h-8 w-4/5 max-sm:hidden" />
				</View>
				<Skeleton lines={4} className="max-sm:hidden" />
			</View>
		</ImageBackground>
	);
};

Header.query = (): QueryIdentifier<Show> => ({
	schema: Show,
	path: ["api", "shows", "random"],
	params: {
		with: ["firstEntry"],
	},
});
