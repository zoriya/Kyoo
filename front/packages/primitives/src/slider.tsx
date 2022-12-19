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

import { useState } from "react";
import { Platform, Pressable, View } from "react-native";
import { percent, Stylable, useYoshiki } from "yoshiki/native";
import { ts } from "./utils";

const calc =
	Platform.OS === "web"
		? (first: number, operator: "+" | "-" | "*" | "/", second: number): number =>
				`calc(${first} ${operator} ${second})` as unknown as number
		: (first: number, operator: "+" | "-" | "*" | "/", second: number): number => {
				switch (operator) {
					case "+":
						return first + second;
					case "-":
						return first - second;
					case "*":
						return first * second;
					case "/":
						return first / second;
				}
		  };

export const Slider = ({
	progress,
	subtleProgress,
	max = 100,
	markers,
	...props
}: { progress: number; max?: number; subtleProgress?: number; markers?: number[] } & Stylable) => {
	const { css } = useYoshiki();
	const [isSeeking, setSeek] = useState(false);

	return (
		<Pressable
			onTouchStart={(event) => {
				// // prevent drag and drop of the UI.
				// event.preventDefault();
				setSeek(true);
			}}
			{...css(
				{
					paddingVertical: ts(1),
				},
				props,
			)}
		>
			<View
				{...css({
					width: percent(100),
					height: ts(1),
					bg: (theme) => theme.overlay0,
				})}
			>
				{subtleProgress && (
					<View
						{...css({
							bg: (theme) => theme.overlay1,
							position: "absolute",
							top: 0,
							bottom: 0,
							left: 0,
							width: percent((subtleProgress / max) * 100),
						})}
					/>
				)}
				<View
					{...css({
						bg: (theme) => theme.accent,
						position: "absolute",
						top: 0,
						bottom: 0,
						left: 0,
						width: percent((progress / max) * 100),
					})}
				/>
				{markers?.map((x) => (
					<View
						key={x}
						{...css({
							position: "absolute",
							top: 0,
							bottom: 0,
							left: percent(Math.min(100, (x / max) * 100)),
							bg: (theme) => theme.accent,
							width: ts(1),
							height: ts(1),
							borderRadius: ts(0.5),
						})}
					/>
				))}
			</View>
			<View
				{...css({
					position: "absolute",
					top: 0,
					bottom: 0,
					margin: "auto",
					left: calc(percent((progress / max) * 100), "-", ts(1)),
					bg: (theme) => theme.accent,
					width: ts(2),
					height: ts(2),
					borderRadius: ts(1),
				})}
			/>
		</Pressable>
	);
};
