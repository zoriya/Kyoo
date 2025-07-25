import type { VideoPlayer } from "react-native-video";
import { useYoshiki } from "yoshiki/native";
import type { KImage } from "~/models";
import { Back } from "./back";
import { BottomControls } from "./bottom-controls";
import { TouchControls } from "./touch";

export const Controls = ({
	player,
	title,
	poster,
}: {
	player: VideoPlayer;
	title: string;
	description: string | null;
	poster: KImage | null;
}) => {
	const { css } = useYoshiki();

	// <TouchControls previousSlug={previousSlug} nextSlug={nextSlug} />
	return (
		<TouchControls
			player={player}
			// onPointerEnter={(e) => {
			// 	if (e.nativeEvent.pointerType === "mouse")
			// 		setHover((x) => ({ ...x, mouseHover: true }));
			// }}
			// onPointerLeave={(e) => {
			// 	if (e.nativeEvent.pointerType === "mouse")
			// 		setHover((x) => ({ ...x, mouseHover: false }));
			// }}
		>
			<Back
				name={title}
				{...css({
					//	pointerEvents: "auto",
					position: "absolute",
					top: 0,
					left: 0,
					right: 0,
					bg: (theme) => theme.darkOverlay,
				})}
			/>
			<BottomControls
				player={player}
				name={title}
				poster={poster!}
				chapters={[]}
				{...css({
					// Fixed is used because firefox android make the hover disapear under the navigation bar in absolute
					// position: Platform.OS === "web" ? ("fixed" as any) : "absolute",
					position: "absolute",
					bottom: 0,
					left: 0,
					right: 0,
					bg: (theme) => theme.darkOverlay,
				})}
			/>
		</TouchControls>
	);
};
