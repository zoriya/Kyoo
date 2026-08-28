import { useWindowDimensions } from "react-native";
import { useBreakpointValue } from "~/primitives";

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
