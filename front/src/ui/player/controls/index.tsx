import { useCallback, useState } from "react";
import type { ViewProps } from "react-native";
import { View } from "react-native";
import type { VideoPlayer } from "react-native-video";
import type { Chapter, KImage } from "~/models";
import { useIsTouch } from "~/primitives";
import { Back } from "./back";
import { BottomControls } from "./bottom-controls";
import { MiddleControls } from "./middle-controls";
import { TouchControls } from "./touch";

export const Controls = ({
	player,
	showHref,
	name,
	poster,
	subName,
	chapters,
	previous,
	next,
}: {
	player: VideoPlayer;
	showHref?: string;
	name?: string;
	poster?: KImage | null;
	subName?: string;
	chapters: Chapter[];
	previous?: string | null;
	next?: string | null;
}) => {
	const isTouch = useIsTouch();

	const [hover, setHover] = useState(false);
	const [menuOpened, setMenuOpened] = useState(false);

	const hoverControls = {
		onPointerEnter: (e) => {
			if (e.nativeEvent.pointerType === "mouse") setHover(true);
		},
		onPointerLeave: (e) => {
			if (e.nativeEvent.pointerType === "mouse") setHover(false);
		},
	} satisfies ViewProps;

	const setMenu = useCallback((val: boolean) => {
		setMenuOpened(val);
		// Disable hover since the menu overlay makes the pointer leave unreliable.
		if (!val) setHover(false);
	}, []);

	return (
		<View className="absolute inset-0">
			<TouchControls
				player={player}
				forceShow={hover || menuOpened}
				className="absolute inset-0"
			>
				<Back
					showHref={showHref}
					name={name}
					className="absolute top-0 w-full bg-slate-900/50 px-safe pt-safe"
					{...hoverControls}
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
					// Fixed is used because firefox android make the hover disappear under the navigation bar in absolute
					// position: Platform.OS === "web" ? ("fixed" as any) : "absolute",
					className="absolute bottom-0 w-full bg-slate-900/50 px-safe pt-safe"
					{...hoverControls}
				/>
			</TouchControls>
		</View>
	);
};

export { LoadingIndicator } from "./misc";
