import { View, type ViewProps } from "react-native";
import Animated from "react-native-reanimated";
import { cn } from "~/utils";

export const Skeleton = ({
	lines = 1,
	variant = "text",
	className,
	...props
}: Omit<ViewProps, "children"> & {
	lines?: number;
	variant?: "text" | "round" | "custom";
}) => {
	return (
		<View
			className={cn(
				"relative",
				lines === 1 && "overflow-hidden rounded",
				variant === "text" && "m-1 h-5 w-4/5",
				variant === "round" && "rounded-full",
				className,
			)}
			{...props}
		>
			{[...Array(lines)].map((_, i) => (
				<View
					key={`skeleton_${i}`}
					className={cn(
						"overflow-hidden rounded bg-gray-400",
						lines === 1 && "absolute inset-0",
						lines !== 1 && "mb-2 h-5 w-full",
						lines !== 1 && i === lines - 1 && "w-2/5",
					)}
				>
					<Animated.View
						className="absolute inset-0 bg-linear-to-r from-transparent via-gray-500 to-transparent"
						style={{
							animationName: {
								from: {
									transform: [{ translateX: "-100%" }],
								},
								to: {
									transform: [{ translateX: "100%" }],
								},
							},
							animationDuration: "1200ms",
							animationDelay: "800ms",
							animationTimingFunction: "ease-out",
							animationIterationCount: "infinite",
						}}
					/>
				</View>
			))}
		</View>
	);
};
