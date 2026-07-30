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
import { useSharedValue } from "react-native-reanimated";
import { usePlayer } from "react-native-omni";
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
import { BottomScrubber } from "../bottom-scrubber";
import { CastButton, FullscreenButton, PlayButton, VolumeSlider } from "./misc";
import { ProgressBar, ProgressText } from "./progress";
import { AudioMenu, QualityMenu, SubtitleMenu, VideoMenu } from "./tracks-menu";

export const BottomControls = ({
	poster,
	name,
	chapters,
	hasPrev,
	hasNext,
	setMenu,
	onOpenEntriesMenu,
	className,
	...props
}: {
	poster?: KImage | null;
	name?: string;
	chapters: Chapter[];
	hasPrev: boolean;
	hasNext: boolean;
	setMenu: (isOpen: boolean) => void;
	onOpenEntriesMenu?: () => void;
} & ViewProps) => {
	const [seek, setSeek] = useState<number | null>(null);
	const bottomSeek = Platform.OS !== "web" && seek !== null;
	// Position of the drag as a 0..1 fraction, written on the UI thread by the
	// slider's pan gesture and read by the bottom scrubber so its filmstrip pans
	// off the JS thread.
	const seekProgress = useSharedValue(0);

	return (
		<View className={cn("flex-row p-2 touch:p-1", className)} {...props}>
			{poster !== null && (
				<View className="m-4 touch:w-1/6 w-1/5 max-w-50 touch:max-w-30 max-sm:hidden">
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
					"my-1 mr-4 flex-1 max-sm:ml-4 no-touch:sm:my-6",
					poster === null && "ml-4",
				)}
			>
				{!bottomSeek &&
					(name ? (
						<H2
							numberOfLines={1}
							className="pb-2 touch:pb-1 text-slate-200 touch:text-xl"
						>
							{name}
						</H2>
					) : (
						<Skeleton className="h-8 w-1/5" />
					))}
				<ProgressBar
					chapters={chapters}
					seek={seek}
					setSeek={setSeek}
					seekProgress={seekProgress}
				/>
				{bottomSeek ? (
					<BottomScrubber
						seek={seek}
						chapters={chapters}
						seekProgress={seekProgress}
					/>
				) : (
					<ControlButtons
						hasPrev={hasPrev}
						hasNext={hasNext}
						setMenu={setMenu}
						onOpenEntriesMenu={onOpenEntriesMenu}
					/>
				)}
			</View>
		</View>
	);
};

const ControlButtons = ({
	hasPrev,
	hasNext,
	setMenu,
	onOpenEntriesMenu,
	className,
	...props
}: {
	hasPrev: boolean;
	hasNext: boolean;
	setMenu: (isOpen: boolean) => void;
	onOpenEntriesMenu?: () => void;
	className?: string;
}) => {
	const { t } = useTranslation();
	const player = usePlayer();

	const menuProps = {
		onMenuOpen: () => setMenu(true),
		onMenuClose: () => setMenu(false),
		className: "mr-4 touch:mr-5",
		iconClassName: "fill-slate-200 dark:fill-slate-200 touch:h-5 touch:w-5",
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
					{hasPrev && (
						<IconButton
							icon={SkipPrevious}
							onPress={() => player.playPrev()}
							className="mr-4"
							iconClassName="fill-slate-200 dark:fill-slate-200"
							{...tooltip(t("player.previous"), true)}
						/>
					)}
					<PlayButton
						className="mr-4"
						iconClassName="fill-slate-200 dark:fill-slate-200"
					/>
					{hasNext && (
						<IconButton
							icon={SkipNext}
							onPress={() => player.playNext()}
							className="mr-4"
							iconClassName="fill-slate-200 dark:fill-slate-200"
							{...tooltip(t("player.next"), true)}
						/>
					)}
					{Platform.OS === "web" && (
						<VolumeSlider iconClassName="fill-slate-200 dark:fill-slate-200" />
					)}
				</View>
				<ProgressText className="mx-2 text-slate-300 dark:text-slate-300" />
			</View>
			<View className="flex-row">
				{onOpenEntriesMenu && (
					<IconButton
						icon={MenuIcon}
						onPress={onOpenEntriesMenu}
						className="mr-4 touch:mr-5"
						iconClassName="fill-slate-200 dark:fill-slate-200 touch:h-5 touch:w-5"
						{...tooltip(t("player.entry-list"), true)}
					/>
				)}
				<CastButton
					className="mr-4 touch:mr-5"
					iconClassName="fill-slate-200 dark:fill-slate-200 touch:h-5 touch:w-5"
				/>
				<SubtitleMenu {...menuProps} />
				<AudioMenu {...menuProps} />
				<VideoMenu {...menuProps} />
				<QualityMenu {...menuProps} />
				{Platform.OS === "web" && (
					<FullscreenButton
						className="mr-4 touch:mr-5"
						iconClassName="fill-slate-200 dark:fill-slate-200 touch:h-5 touch:w-5"
					/>
				)}
			</View>
		</View>
	);
};
