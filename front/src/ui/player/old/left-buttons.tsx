import {
	IconButton,
	Link,
	noTouch,
	tooltip,
	touchOnly,
	ts,
} from "@kyoo/primitives";
import { useAtom, useAtomValue } from "jotai";
import { useTranslation } from "react-i18next";
import { Platform, View } from "react-native";
import { px, type Stylable, useYoshiki } from "yoshiki/native";
import { HoverTouch, hoverAtom } from ".";
import { playAtom } from "../old/state";

export const TouchControls = ({
	previousSlug,
	nextSlug,
	...props
}: {
	previousSlug?: string | null;
	nextSlug?: string | null;
}) => {
	const { css } = useYoshiki();
	const [isPlaying, setPlay] = useAtom(playAtom);
	const hover = useAtomValue(hoverAtom);

	const common = css(
		[
			{
				backgroundColor: (theme) => theme.darkOverlay,
				marginHorizontal: ts(3),
			},
		],
		touchOnly,
	);

	return (
		<HoverTouch
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
			{hover && (
				<>
					<IconButton
						icon={SkipPrevious}
						as={Link}
						href={previousSlug!}
						replace
						size={ts(4)}
						{...css(
							[!previousSlug && { opacity: 0, pointerEvents: "none" }],
							common,
						)}
					/>
					<IconButton
						icon={isPlaying ? Pause : PlayArrow}
						onPress={() => setPlay(!isPlaying)}
						size={ts(8)}
						{...common}
					/>
					<IconButton
						icon={SkipNext}
						as={Link}
						href={nextSlug!}
						replace
						size={ts(4)}
						{...css(
							[!nextSlug && { opacity: 0, pointerEvents: "none" }],
							common,
						)}
					/>
				</>
			)}
		</HoverTouch>
	);
};
