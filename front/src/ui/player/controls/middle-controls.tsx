import SkipNext from "@material-symbols/svg-400/rounded/skip_next-fill.svg";
import SkipPrevious from "@material-symbols/svg-400/rounded/skip_previous-fill.svg";
import { View } from "react-native";
import { IconButton } from "~/primitives";
import { cn } from "~/utils";
import { PlayButton } from "./misc";

export const MiddleControls = ({
	playPrev,
	playNext,
	className,
	...props
}: {
	playPrev: (() => boolean) | null;
	playNext: (() => boolean) | null;
	className?: string;
}) => {
	return (
		<View
			className={cn(
				"absolute inset-0 flex-row items-center justify-center",
				className,
			)}
			{...props}
		>
			<IconButton
				icon={SkipPrevious}
				onPress={playPrev ? () => playPrev() : undefined}
				className={cn(
					"mx-6 bg-gray-800/70",
					!playPrev && "pointer-events-none opacity-0",
				)}
				iconClassName="h-16 w-16 fill-slate-200 dark:fill-slate-200"
			/>
			<PlayButton
				className={cn("mx-6 bg-gray-800/50")}
				iconClassName="h-24 w-24 fill-slate-200 dark:fill-slate-200"
			/>
			<IconButton
				icon={SkipNext}
				onPress={playNext ? () => playNext() : undefined}
				className={cn(
					"mx-6 bg-gray-800/70",
					!playNext && "pointer-events-none opacity-0",
				)}
				iconClassName="h-16 w-16 fill-slate-200 dark:fill-slate-200"
			/>
		</View>
	);
};
