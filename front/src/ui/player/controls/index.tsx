import { useCallback, useState } from "react";
import type { ViewProps } from "react-native";
import { View } from "react-native";
import type { Chapter, KImage, Show } from "~/models";
import { Back } from "./back";
import { BottomControls } from "./bottom-controls";
import { MiddleControls } from "./middle-controls";
import { SkipChapterButton } from "./skip-chapter";
import { TouchControls } from "./touch";

export const Controls = ({
	showHref,
	name,
	poster,
	showKind,
	showLogo,
	subName,
	chapters,
	playPrev,
	playNext,
	seekEnd,
	onOpenEntriesMenu,
	forceShow,
}: {
	showHref?: string;
	name?: string;
	poster?: KImage | null;
	showKind?: Show["kind"];
	showLogo?: KImage | null;
	subName?: string;
	chapters: Chapter[];
	playPrev: (() => boolean) | null;
	playNext: (() => boolean) | null;
	seekEnd: () => void;
	onOpenEntriesMenu?: () => void;
	forceShow?: boolean;
}) => {
	const [hover, setHover] = useState(false);
	const [menuOpened, setMenuOpened] = useState(false);
	const [controlsVisible, setControlsVisible] = useState(false);

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
				forceShow={hover || menuOpened || forceShow}
				onVisibilityChange={setControlsVisible}
				className="absolute inset-0"
			>
				<Back
					showHref={showHref}
					name={name}
					kind={showKind}
					logo={showLogo}
					className="absolute top-0 w-full bg-slate-900/50 px-safe pt-safe"
					{...hoverControls}
				/>
				<MiddleControls
					playPrev={playPrev}
					playNext={playNext}
					className="touch:flex hidden"
				/>
				<BottomControls
					name={subName}
					poster={poster}
					chapters={chapters}
					playPrev={playPrev}
					playNext={playNext}
					onOpenEntriesMenu={onOpenEntriesMenu}
					setMenu={setMenu}
					className="absolute bottom-0 w-full bg-slate-900/50 px-safe pt-safe"
					{...hoverControls}
				/>
			</TouchControls>
			<SkipChapterButton
				chapters={chapters}
				isVisible={controlsVisible}
				seekEnd={seekEnd}
			/>
		</View>
	);
};

export { LoadingIndicator } from "./misc";
