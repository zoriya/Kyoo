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

import { ActivityIndicator, Platform, View } from "react-native";
import { Circle, Svg } from "react-native-svg";
import { px, type Stylable, useYoshiki } from "yoshiki/native";

export const CircularProgress = ({
	size = 48,
	tickness = 5,
	color,
	...props
}: { size?: number; tickness?: number; color?: string } & Stylable) => {
	const { css, theme } = useYoshiki();

	if (Platform.OS !== "web")
		return <ActivityIndicator size={size} color={color ?? theme.accent} {...props} />;

	return (
		<View {...css({ width: size, height: size, overflow: "hidden" }, props)}>
			<style jsx global>{`
				@keyframes circularProgress-svg {
					0% {
						transform: rotate(0deg);
					}
					100% {
						transform: rotate(360deg);
					}
				}
				@keyframes circularProgress-circle {
					0% {
						stroke-dasharray: 1px, 200px;
						stroke-dashoffset: 0;
					}
					50% {
						stroke-dasharray: 100px, 200px;
						stroke-dashoffset: -15px;
					}
					100% {
						stroke-dasharray: 100px, 200px;
						stroke-dashoffset: -125px;
					}
				}
			`}</style>
			<Svg
				viewBox={`${size / 2} ${size / 2} ${size} ${size}`}
				{...css(
					// @ts-ignore Web only
					Platform.OS === "web" && { animation: "circularProgress-svg 1.4s ease-in-out infinite" },
				)}
			>
				<Circle
					cx={size}
					cy={size}
					r={(size - tickness) / 2}
					strokeWidth={tickness}
					fill="none"
					stroke={color ?? theme.accent}
					strokeDasharray={[px(80), px(200)]}
					{...css(
						Platform.OS === "web" && {
							// @ts-ignore Web only
							animation: "circularProgress-circle 1.4s ease-in-out infinite",
						},
					)}
				/>
			</Svg>
		</View>
	);
};
