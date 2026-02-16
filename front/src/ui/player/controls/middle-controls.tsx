import SkipNext from "@material-symbols/svg-400/rounded/skip_next-fill.svg";
import SkipPrevious from "@material-symbols/svg-400/rounded/skip_previous-fill.svg";
import { View } from "react-native";
import type { VideoPlayer } from "react-native-video";
import { IconButton, Link } from "~/primitives";
import { cn } from "~/utils";
import { PlayButton } from "./misc";

export const MiddleControls = ({
	player,
	previous,
	next,
	className,
	...props
}: {
	player: VideoPlayer;
	previous?: string | null;
	next?: string | null;
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
				as={Link}
				href={previous}
				replace
				className={cn(
					"mx-6 bg-gray-800/70",
					!previous && "pointer-events-none opacity-0",
				)}
				iconClassName="h-16 w-16 fill-slate-200 dark:fill-slate-200"
			/>
			<PlayButton
				player={player}
				className={cn("mx-6 bg-gray-800/50")}
				iconClassName="h-24 w-24 fill-slate-200 dark:fill-slate-200"
			/>
			<IconButton
				icon={SkipNext}
				as={Link}
				href={next}
				replace
				className={cn(
					"mx-6 bg-gray-800/70",
					!next && "pointer-events-none opacity-0",
				)}
				iconClassName="h-16 w-16 fill-slate-200 dark:fill-slate-200"
			/>
		</View>
	);
};
