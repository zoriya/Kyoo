import type { SharedValue } from "react-native-reanimated";
import type { Chapter } from "~/models";

// On web the bottom scrubber is never shown (the inline slider tooltip handles
// seek previews there — see `BottomControls`'s `bottomSeek` guard), so the
// default/web module is a no-op. The real filmstrip lives in the `.native`
// variant and is drawn on a Skia canvas.
export const BottomScrubber = (_props: {
	chapters?: Chapter[];
	seek: number;
	seekProgress?: SharedValue<number>;
}) => null;
