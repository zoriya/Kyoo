import SkipNext from "@material-symbols/svg-400/rounded/skip_next-fill.svg";
import SkipPrevious from "@material-symbols/svg-400/rounded/skip_previous-fill.svg";
import { type ComponentProps, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	Platform,
	type PressableProps,
	View,
	type ViewProps,
} from "react-native";
import type { VideoPlayer } from "react-native-video";
import type { Chapter, KImage } from "~/models";
import {
	H2,
	IconButton,
	Link,
	type Menu,
	Poster,
	Skeleton,
	tooltip,
	useIsTouch,
} from "~/primitives";
import { cn } from "~/utils";
import { BottomScrubber } from "../scrubber";
import { FullscreenButton, PlayButton, VolumeSlider } from "./misc";
import { ProgressBar, ProgressText } from "./progress";
import { AudioMenu, QualityMenu, SubtitleMenu, VideoMenu } from "./tracks-menu";

export const BottomControls = ({
	player,
	poster,
	name,
	chapters,
	previous,
	next,
	setMenu,
	className,
	...props
}: {
	player: VideoPlayer;
	poster?: KImage | null;
	name?: string;
	chapters: Chapter[];
	previous?: string | null;
	next?: string | null;
	setMenu: (isOpen: boolean) => void;
} & ViewProps) => {
	const [seek, setSeek] = useState<number | null>(null);
	const bottomSeek = Platform.OS !== "web" && seek !== null;

	return (
		<View className={cn("flex-row p-2", className)} {...props}>
			<View className="m-4 w-1/5 max-w-50 max-sm:hidden">
				{poster !== undefined ? (
					<Poster
						src={poster}
						quality="low"
						className="absolute bottom-0 w-full"
					/>
				) : (
					<Poster.Loader className="absolute bottom-0 w-full" />
				)}
			</View>
			<View className="my-1 mr-4 flex-1 max-sm:ml-4 sm:my-6">
				{!bottomSeek &&
					(name ? (
						<H2 numberOfLines={1} className="pb-2 text-slate-200">
							{name}
						</H2>
					) : (
						<Skeleton className="h-8 w-1/5" />
					))}
				<ProgressBar
					player={player}
					chapters={chapters}
					seek={seek}
					setSeek={setSeek}
				/>
				{bottomSeek ? (
					<BottomScrubber player={player} seek={seek} chapters={chapters} />
				) : (
					<ControlButtons
						player={player}
						previous={previous}
						next={next}
						setMenu={setMenu}
					/>
				)}
			</View>
		</View>
	);
};

const ControlButtons = ({
	player,
	previous,
	next,
	setMenu,
	className,
	...props
}: {
	player: VideoPlayer;
	previous?: string | null;
	next?: string | null;
	setMenu: (isOpen: boolean) => void;
	className?: string;
}) => {
	const { t } = useTranslation();
	const isTouch = useIsTouch();

	const menuProps = {
		onMenuOpen: () => setMenu(true),
		onMenuClose: () => setMenu(false),
		className: "mr-4",
		iconClassName: "fill-slate-200 dark:fill-slate-200",
	} satisfies Partial<
		ComponentProps<
			typeof Menu<ComponentProps<typeof IconButton<PressableProps>>>
		>
	>;

	return (
		<View
			className={cn("flex-1 flex-row flex-wrap justify-between", className)}
			{...props}
		>
			<View className="flex-row items-center">
				{!isTouch && (
					<View className="flex-row">
						{previous && (
							<IconButton
								icon={SkipPrevious}
								as={Link}
								href={`/watch/${previous}`}
								replace
								className="mr-4"
								iconClassName="fill-slate-200 dark:fill-slate-200"
								{...tooltip(t("player.previous"), true)}
							/>
						)}
						<PlayButton
							player={player}
							className="mr-4"
							iconClassName="fill-slate-200 dark:fill-slate-200"
						/>
						{next && (
							<IconButton
								icon={SkipNext}
								as={Link}
								href={`/watch/${next}`}
								replace
								className="mr-4"
								iconClassName="fill-slate-200 dark:fill-slate-200"
								{...tooltip(t("player.next"), true)}
							/>
						)}
						{Platform.OS === "web" && (
							<VolumeSlider
								player={player}
								iconClassName="fill-slate-200 dark:fill-slate-200"
							/>
						)}
					</View>
				)}
				<ProgressText
					player={player}
					className="mx-2 text-slate-300 dark:text-slate-300"
				/>
			</View>
			<View className="flex-row">
				<SubtitleMenu player={player} {...menuProps} />
				<AudioMenu player={player} {...menuProps} />
				<VideoMenu player={player} {...menuProps} />
				<QualityMenu player={player} {...menuProps} />
				{Platform.OS === "web" && (
					<FullscreenButton
						className="mr-4"
						iconClassName="fill-slate-200 dark:fill-slate-200"
					/>
				)}
			</View>
		</View>
	);
};
