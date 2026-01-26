import { LinearGradient as LG } from "expo-linear-gradient";
import { useEffect } from "react";
import { StyleSheet, View, type ViewProps } from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withRepeat,
	withTiming,
} from "react-native-reanimated";
import { em, percent, px, rem, useYoshiki } from "yoshiki/native";
import { cn } from "~/utils";

const LinearGradient = Animated.createAnimatedComponent(LG);

export const Skeleton = ({
	lines = 1,
	variant = "text",
	...props
}: Omit<ViewProps, "children"> & {
	lines?: number;
	variant?: "text" | "round" | "custom";
}) => {
	const { css, theme } = useYoshiki();
	const width = useSharedValue(-900);
	const mult = useSharedValue(-1);
	const animated = useAnimatedStyle(() => ({
		transform: [
			{
				translateX: width.value * mult.value,
			},
		],
	}));

	useEffect(() => {
		mult.value = withRepeat(
			withDelay(800, withTiming(1, { duration: 800 })),
			0,
		);
	});

	return (
		<View
			className={cn(
				"relative",
				lines === 1 && "overflow-hidden rounded",
				variant === "text" && "m-1 h-5 w-4/5",
				variant === "round" && "rounded-full",
			)}
			{...props}
		>
			{[...Array(lines)].map((_, i) => (
				<View
					key={`skeleton_${i}`}
					onLayout={(e) => {
						if (i === 0) width.value = e.nativeEvent.layout.width;
					}}
					className={cn(
						"bg-gray-300",
						lines === 1 && "absolute inset-0",
						lines !== 1 && "mb-2 h-5 w-full overflow-hidden rounded",
						lines !== 1 && i === lines - 1 && "w-2/5",
					)}
				>
					<View className="absolute inset-0 bg-linear-to-r from-transparent via-gray-500 to-transparent" />
					<LinearGradient
						start={{ x: 0, y: 0.5 }}
						end={{ x: 1, y: 0.5 }}
						colors={["transparent", theme.overlay1, "transparent"]}
						style={[StyleSheet.absoluteFillObject, animated]}
					/>
				</View>
			))}
		</View>
	);
};
