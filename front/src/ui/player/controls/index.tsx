import { useState } from "react";
import type { ViewProps } from "react-native";
import type { VideoPlayer } from "react-native-video";
import { useYoshiki } from "yoshiki/native";
import type { Chapter, KImage } from "~/models";
import { Back } from "./back";
import { BottomControls } from "./bottom-controls";
import { TouchControls } from "./touch";

export const Controls = ({
	player,
	title,
	subTitle,
	poster,
	chapters,
	previous,
	next,
}: {
	player: VideoPlayer;
	title: string;
	subTitle: string;
	poster: KImage;
	chapters: Chapter[];
	previous: string | null;
	next: string | null;
}) => {
	const { css } = useYoshiki();

	const [hover, setHover] = useState(false);
	const [menuOpenned, setMenu] = useState(false);

	// <TouchControls previousSlug={previousSlug} nextSlug={nextSlug} />

	const hoverControls = {
		onPointerEnter: (e) => {
			if (e.nativeEvent.pointerType === "mouse") setHover(true);
		},
		onPointerLeave: (e) => {
			if (e.nativeEvent.pointerType === "mouse") setHover(false);
		},
	} satisfies ViewProps;

	return (
		<TouchControls player={player} forceShow={hover || menuOpenned}>
			<Back
				name={title}
				{...css(
					{
						//	pointerEvents: "auto",
						position: "absolute",
						top: 0,
						left: 0,
						right: 0,
						bg: (theme) => theme.darkOverlay,
					},
					hoverControls,
				)}
			/>
			<BottomControls
				player={player}
				name={subTitle}
				poster={poster}
				chapters={chapters}
				previous={previous}
				next={next}
				setMenu={setMenu}
				{...css(
					{
						// Fixed is used because firefox android make the hover disapear under the navigation bar in absolute
						// position: Platform.OS === "web" ? ("fixed" as any) : "absolute",
						position: "absolute",
						bottom: 0,
						left: 0,
						right: 0,
						bg: (theme) => theme.darkOverlay,
					},
					hoverControls,
				)}
			/>
		</TouchControls>
	);
};

export { LoadingIndicator } from "./misc";
