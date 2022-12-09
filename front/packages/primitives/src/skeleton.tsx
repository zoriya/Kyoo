/*
 * Kyoo - A portable and vast media library solution.
 * Copyright (c) Kyoo.
 *
 * See AUTHORS.md and LICENSE file in the project root for full license information.
 *
 * Kyoo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * Kyoo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Kyoo. If not, see <https://www.gnu.org/licenses/>.
 */

import { LinearGradient as LG } from "expo-linear-gradient";
import { AnimatePresence, motify, MotiView } from "moti";
import { useState } from "react";
import { Platform, View, ViewProps } from "react-native";
import { px, rem, useYoshiki, percent } from "yoshiki/native";
import { hiddenIfNoJs } from "./utils/nojs";

const LinearGradient = motify(LG)();

export const SkeletonCss = () => (
	<style jsx global>{`
		@keyframes skeleton {
			0% {
				transform: translateX(-100%);
			}
			50% {
				transform: translateX(100%);
			}
			100% {
				transform: translateX(100%);
			}
		}
	`}</style>
);

export const Skeleton = ({
	children,
	show,
	variant = "text",
	...props
}: Omit<ViewProps, "children"> & {
	children?: JSX.Element | boolean | null;
	show?: boolean;
	variant?: "text" | "round" | "custom";
}) => {
	const { css, theme } = useYoshiki();
	const [width, setWidth] = useState<number | undefined>(undefined);
	const perc = (v: number) => (v / 100) * width!;

	if (show === undefined && children && children !== true) return children;

	return (
		<View
			{...css(
				[
					{
						margin: px(2),
						position: "relative",
						overflow: "hidden",
						borderRadius: px(6),
					},
					variant === "text" && {
						width: percent(75),
						height: rem(1.2),
					},
					variant === "round" && {
						borderRadius: 9999999,
					},
				],
				props,
			)}
		>
			<AnimatePresence>
				{children}
				{show && (
					<MotiView
						key="skeleton"
						animate={{ opacity: "1" }}
						exit={{ opacity: 0 }}
						transition={{ type: "timing" }}
						onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
						{...css(
							{
								bg: (theme) => theme.overlay0,
								position: "absolute",
								top: 0,
								bottom: 0,
								left: 0,
								right: 0,
							},
							hiddenIfNoJs,
						)}
					>
						<LinearGradient
							start={{ x: 0, y: 0.5 }}
							end={{ x: 1, y: 0.5 }}
							colors={["transparent", theme.overlay1, "transparent"]}
							transition={{
								loop: true,
								repeatReverse: false,
							}}
							animate={{
								translateX: width
									? [perc(-100), { value: perc(100), type: "timing", duration: 800, delay: 800 }]
									: undefined,
							}}
							{...css([
								{
									position: "absolute",
									top: 0,
									bottom: 0,
									left: 0,
									right: 0,
								},
								Platform.OS === "web" && {
									// @ts-ignore Web only properties
									animation: "skeleton 1.6s linear 0.5s infinite",
									transform: "translateX(-100%)",
								},
							])}
						/>
					</MotiView>
				)}
			</AnimatePresence>
		</View>
	);
};
