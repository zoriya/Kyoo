import MenuIcon from "@material-symbols/svg-400/rounded/menu-fill.svg";
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
	type Menu,
	Poster,
	Skeleton,
	tooltip,
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
	playPrev,
	playNext,
	setMenu,
	onOpenEntriesMenu,
	className,
	...props
}: {
	player: VideoPlayer;
	poster?: KImage | null;
	name?: string;
	chapters: Chapter[];
	playPrev: (() => boolean) | null;
	playNext: (() => boolean) | null;
	setMenu: (isOpen: boolean) => void;
	onOpenEntriesMenu?: () => void;
} & ViewProps) => {
	const [seek, setSeek] = useState<number | null>(null);
	const bottomSeek = Platform.OS !== "web" && seek !== null;

	return (
		<View className={cn("flex-row p-2", className)} {...props}>
			{poster !== null && (
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
			)}
			<View
				className={cn(
					"my-1 mr-4 flex-1 max-sm:ml-4 sm:my-6",
					poster === null && "ml-4",
				)}
			>
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
						playPrev={playPrev}
						playNext={playNext}
						setMenu={setMenu}
						onOpenEntriesMenu={onOpenEntriesMenu}
					/>
				)}
			</View>
		</View>
	);
};

const ControlButtons = ({
	player,
	playPrev,
	playNext,
	setMenu,
	onOpenEntriesMenu,
	className,
	...props
}: {
	player: VideoPlayer;
	playPrev: (() => boolean) | null;
	playNext: (() => boolean) | null;
	setMenu: (isOpen: boolean) => void;
	onOpenEntriesMenu?: () => void;
	className?: string;
}) => {
	const { t } = useTranslation();

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
				<View className="touch:hidden flex-row">
					{playPrev && (
						<IconButton
							icon={SkipPrevious}
							onPress={() => playPrev()}
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
					{playNext && (
						<IconButton
							icon={SkipNext}
							onPress={() => playNext()}
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
				<ProgressText
					player={player}
					className="mx-2 text-slate-300 dark:text-slate-300"
				/>
			</View>
			<View className="flex-row">
				{onOpenEntriesMenu && (
					<IconButton
						icon={MenuIcon}
						onPress={onOpenEntriesMenu}
						className="mr-4"
						iconClassName="fill-slate-200 dark:fill-slate-200"
						{...tooltip(t("player.entry-list"), true)}
					/>
				)}
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
