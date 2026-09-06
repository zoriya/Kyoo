import { useWindowDimensions } from "react-native";
import { rem, useBreakpointValue } from "~/primitives";

export const useHeroHeight = () => {
	const { height } = useWindowDimensions();
	const ratio = useBreakpointValue({ xs: 0.4, sm: 0.6, lg: 0.65 });
	const min = useBreakpointValue({ xs: 0, sm: rem(187.5), md: rem(170) });

	return Math.round(Math.min(Math.max(height * ratio, min), height * 0.65));
};
