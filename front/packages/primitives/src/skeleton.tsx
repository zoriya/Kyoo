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
import { Platform, View, type ViewProps } from "react-native";
import { px, rem, useYoshiki, percent, em } from "yoshiki/native";
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
	show: forcedShow,
	lines = 1,
	variant = "text",
	...props
}: Omit<ViewProps, "children"> & {
	children?: JSX.Element | JSX.Element[] | boolean | null;
	show?: boolean;
	lines?: number;
	variant?: "text" | "header" | "round" | "custom" | "fill" | "filltext";
}) => {
	const { css, theme } = useYoshiki();
	const [width, setWidth] = useState<number | undefined>(undefined);
	const perc = (v: number) => (v / 100) * width!;

	if (forcedShow === undefined && children && children !== true) return <>{children}</>;

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
			<AnimatePresence>
				{children}
				{(forcedShow || !children || children === true) &&
					[...Array(lines)].map((_, i) => (
						<MotiView
							key={`skeleton_${i}`}
							// No clue why it is a number on mobile and a string on web but /shrug
							animate={{ opacity: Platform.OS === "web" ? ("1" as any) : 1 }}
							exit={{ opacity: 0 }}
							transition={{ type: "timing" }}
							onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
							{...css(
								[
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
								],
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
					))}
			</AnimatePresence>
		</View>
	);
};
