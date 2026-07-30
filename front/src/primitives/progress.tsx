import Animated from "react-native-reanimated";
import { cn } from "~/utils";

export const Spinner = ({
	size = 40,
	className,
}: {
	size?: number;
	className?: string;
}) => {
	return (
		<Animated.View
			className={cn(
				"rounded-full border-4 border-white/25 border-t-accent",
				className,
			)}
			style={{
				width: size,
				height: size,
				animationName: {
					from: { transform: [{ rotate: "0deg" }] },
					to: { transform: [{ rotate: "360deg" }] },
				},
				animationDuration: "900ms",
				animationTimingFunction: "linear",
				animationIterationCount: "infinite",
			}}
		/>
	);
};
