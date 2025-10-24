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

const LinearGradient = Animated.createAnimatedComponent(LG);

export const Skeleton = ({
	lines = 1,
	variant = "text",
	...props
}: Omit<ViewProps, "children"> & {
	lines?: number;
	variant?: "text" | "header" | "round" | "custom" | "fill" | "filltext";
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
			{...css(
				[
					{
						position: "relative",
					},
					lines === 1 && { overflow: "hidden", borderRadius: px(6) },
					(variant === "text" || variant === "header") &&
						lines === 1 && [
							{
								width: percent(75),
								height: rem(1.2),
								margin: px(2),
							},
							variant === "text" && {
								margin: px(2),
							},
							variant === "header" && {
								marginBottom: rem(0.5),
							},
						],

					variant === "round" && {
						borderRadius: 9999999,
					},
					variant === "fill" && {
						width: percent(100),
						height: percent(100),
					},
					variant === "filltext" && {
						width: percent(100),
						height: em(1),
					},
				],
				props,
			)}
		>
			{[...Array(lines)].map((_, i) => (
				<View
					key={`skeleton_${i}`}
					onLayout={(e) => {
						if (i === 0) width.value = e.nativeEvent.layout.width;
					}}
					{...css([
						{
							bg: (theme) => theme.overlay0,
						},
						lines === 1 && {
							position: "absolute",
							top: 0,
							bottom: 0,
							left: 0,
							right: 0,
						},
						lines !== 1 && {
							width: i === lines - 1 ? percent(40) : percent(100),
							height: rem(1.2),
							marginBottom: rem(0.5),
							overflow: "hidden",
							borderRadius: px(6),
						},
					])}
				>
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
