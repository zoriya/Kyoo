import { useState } from "react";
import type { ViewProps } from "react-native";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { VideoPlayer } from "react-native-video";
import { useYoshiki } from "yoshiki/native";
import type { Chapter, KImage } from "~/models";
import { useIsTouch } from "~/primitives";
import { Back } from "./back";
import { BottomControls } from "./bottom-controls";
import { MiddleControls } from "./middle-controls";
import { TouchControls } from "./touch";

export const Controls = ({
	player,
	name,
	poster,
	subName,
	chapters,
	previous,
	next,
}: {
	player: VideoPlayer;
	name?: string;
	poster?: KImage | null;
	subName?: string;
	chapters: Chapter[];
	previous?: string | null;
	next?: string | null;
}) => {
	const { css } = useYoshiki();
	const insets = useSafeAreaInsets();
	const isTouch = useIsTouch();

	const [hover, setHover] = useState(false);
	const [menuOpenned, setMenu] = useState(false);

	const hoverControls = {
		onPointerEnter: (e) => {
			if (e.nativeEvent.pointerType === "mouse") setHover(true);
		},
		onPointerLeave: (e) => {
			if (e.nativeEvent.pointerType === "mouse") setHover(false);
		},
	} satisfies ViewProps;

	return (
		<View {...css(StyleSheet.absoluteFillObject)}>
			<TouchControls
				player={player}
				forceShow={hover || menuOpenned}
				{...css(StyleSheet.absoluteFillObject)}
			/>
			<Back
				name={name}
				{...css(
					{
						position: "absolute",
						top: 0,
						left: 0,
						right: 0,
						bg: (theme) => theme.darkOverlay,
						paddingTop: insets.top,
						paddingLeft: insets.left,
						paddingRight: insets.right,
					},
					hoverControls,
				)}
			/>
			{isTouch && (
				<MiddleControls player={player} previous={previous} next={next} />
			)}
			<BottomControls
				player={player}
				name={subName}
				poster={poster}
				chapters={chapters}
				previous={previous}
				next={next}
				setMenu={setMenu}
				{...css(
					{
						// Fixed is used because firefox android make the hover disappear under the navigation bar in absolute
						// position: Platform.OS === "web" ? ("fixed" as any) : "absolute",
						position: "absolute",
						bottom: 0,
						left: 0,
						right: 0,
						bg: (theme) => theme.darkOverlay,
						paddingLeft: insets.left,
						paddingRight: insets.right,
						paddingBottom: insets.bottom,
					},
					hoverControls,
				)}
			/>
		</View>
	);
};

export { LoadingIndicator } from "./misc";
