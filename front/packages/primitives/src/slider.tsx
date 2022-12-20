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

import { useRef, useState } from "react";
import { Platform, View } from "react-native";
import { percent, Stylable, useYoshiki } from "yoshiki/native";
import { ts } from "./utils";

export const Slider = ({
	progress,
	subtleProgress,
	max = 100,
	markers,
	setProgress,
	startSeek,
	endSeek,
	...props
}: {
	progress: number;
	max?: number;
	subtleProgress?: number;
	markers?: number[];
	setProgress: (progress: number) => void;
	startSeek?: () => void;
	endSeek?: () => void;
} & Stylable) => {
	const { css } = useYoshiki();
	const ref = useRef<View>(null);
	const [layout, setLayout] = useState({ x: 0, width: 0 });
	const [isSeeking, setSeek] = useState(false);
	const [isHover, setHover] = useState(false);
	const [isFocus, setFocus] = useState(false);
	const smallBar = !(isSeeking || isHover || isFocus);

	// TODO keyboard handling (left, right, up, down)
	return (
		<View
			ref={ref}
			// @ts-ignore Web only
			onMouseEnter={() => setHover(true)}
			// @ts-ignore Web only
			onMouseLeave={() => setHover(false)}
			// TODO: This does not work
			tabindex={0}
			onFocus={() => setFocus(true)}
			onBlur={() => setFocus(false)}
			onStartShouldSetResponder={() => true}
			onResponderGrant={() => {
				setSeek(true);
				startSeek?.call(null);
			}}
			onResponderRelease={() => {
				setSeek(false);
				endSeek?.call(null);
			}}
			onResponderMove={(event) => {
				event.preventDefault();
				const locationX = Platform.select({
					android: event.nativeEvent.pageX - layout.x,
					default: event.nativeEvent.locationX,
				});
				setProgress(Math.max(0, Math.min(locationX / layout.width, 100)) * max);
			}}
			onLayout={() =>
				ref.current?.measure((_, __, width, ___, pageX) =>
					setLayout({ width: width, x: pageX }),
				)
			}
			{...css(
				{
					paddingVertical: ts(1),
					focus: {
						shadowRadius: 0,
					},
				},
				props,
			)}
		>
			<View
				{...css([
					{
						width: percent(100),
						height: ts(1),
						bg: (theme) => theme.overlay0,
					},
					smallBar && { transform: [{ scaleY: 0.4 }] },
				])}
			>
				{subtleProgress !== undefined && (
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
					{...css(
						{
							bg: (theme) => theme.accent,
							position: "absolute",
							top: 0,
							bottom: 0,
							left: 0,
						},
						{
							// In an inline style because yoshiki's insertion can not catch up with the constant redraw
							style: {
								width: percent((progress / max) * 100),
							},
						},
					)}
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
							width: ts(0.5),
							height: ts(1),
						})}
					/>
				))}
			</View>
			<View
				{...css(
					[
						{
							position: "absolute",
							top: 0,
							bottom: 0,
							marginY: ts(.5),
							bg: (theme) => theme.accent,
							width: ts(2),
							height: ts(2),
							borderRadius: ts(1),
						},
						smallBar && { opacity: 0 },
					],
					{
						style: {
							left: percent((progress / max) * 100),
						},
					},
				)}
			/>
		</View>
	);
};
