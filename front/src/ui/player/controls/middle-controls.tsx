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
					"mx-12 h-16 w-16 bg-gray-800/70",
					!previous && "pointer-events-none opacity-0",
				)}
			/>
			<PlayButton
				player={player}
				className={cn("mx-12 h-32 w-32 bg-gray-800/70")}
			/>
			<IconButton
				icon={SkipNext}
				as={Link}
				href={next}
				replace
				className={cn(
					"mx-12 h-16 w-16 bg-gray-800/70",
					!next && "pointer-events-none opacity-0",
				)}
			/>
		</View>
	);
};
