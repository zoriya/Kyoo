import { useWindowDimensions } from "react-native";
import { useBreakpointValue } from "~/primitives";
import { useRailWidth } from "./navbar-tv";

// The hero image of the home and details screens. It is meant to fill the first
// screenful, but never more than that: a tv is 960x540dp, so the `min-h` that
// makes it look right on a tablet would push the rows below it a whole page down
// and cost a couple of dpad presses to reach anything.
// It is a hook rather than a class list because the lists above it need the same
// number for their header size and their scroll interpolation.
export const useHeroHeight = () => {
	const { height } = useWindowDimensions();
	const ratio = useBreakpointValue({ xs: 0.4, sm: 0.6, lg: 0.65 });
	const min = useBreakpointValue({ xs: 0, sm: 750, md: 680 });

	return Math.round(Math.min(Math.max(height * ratio, min), height * 0.65));
};

// The hero is the background of its screen, so it reaches back under the nav
// rail floating over it — the text on top of it does not, it stays in the column
// the rest of the page lives in.
export const useHeroBleed = () => {
	const rail = useRailWidth();
	// padding rather than a margin on the content so it adds to whatever margin
	// the caller already has.
	return { image: { marginLeft: -rail }, content: { paddingLeft: rail } };
};
