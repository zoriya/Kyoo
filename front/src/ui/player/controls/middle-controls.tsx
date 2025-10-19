import SkipNext from "@material-symbols/svg-400/rounded/skip_next-fill.svg";
import SkipPrevious from "@material-symbols/svg-400/rounded/skip_previous-fill.svg";
import { View } from "react-native";
import type { VideoPlayer } from "react-native-video";
import { useYoshiki } from "yoshiki/native";
import { IconButton, Link, ts } from "~/primitives";
import { PlayButton } from "./misc";

export const MiddleControls = ({
	player,
	previous,
	next,
	...props
}: {
	player: VideoPlayer;
	previous?: string | null;
	next?: string | null;
}) => {
	const { css } = useYoshiki();

	const common = css({
		backgroundColor: (theme) => theme.darkOverlay,
		marginHorizontal: ts(3),
	});

	return (
		<View
			{...css(
				{
					flexDirection: "row",
					justifyContent: "center",
					alignItems: "center",
					position: "absolute",
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
				},
				props,
			)}
		>
			<IconButton
				icon={SkipPrevious}
				as={Link}
				href={previous ?? ""}
				replace
				size={ts(4)}
				{...css([!previous && { opacity: 0, pointerEvents: "none" }], common)}
			/>
			<PlayButton player={player} size={ts(8)} {...common} />
			<IconButton
				icon={SkipNext}
				as={Link}
				href={next ?? ""}
				replace
				size={ts(4)}
				{...css([!next && { opacity: 0, pointerEvents: "none" }], common)}
			/>
		</View>
	);
};
