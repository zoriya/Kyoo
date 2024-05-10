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
import { type GestureResponderEvent, Platform, View } from "react-native";
import { px, percent, Stylable, useYoshiki } from "yoshiki/native";
import { focusReset } from "./utils";
import type { ViewProps } from "react-native-svg/lib/typescript/fabric/utils";

export const Slider = ({
	progress,
	subtleProgress,
	max = 100,
	markers,
	setProgress,
	startSeek,
	endSeek,
	onHover,
	size = 6,
	...props
}: {
	progress: number;
	max?: number;
	subtleProgress?: number;
	markers?: number[];
	setProgress: (progress: number) => void;
	startSeek?: () => void;
	endSeek?: () => void;
	onHover?: (
		position: number | null,
		layout: { x: number; y: number; width: number; height: number },
	) => void;
	size?: number;
} & Partial<ViewProps>) => {
	const { css } = useYoshiki();
	const ref = useRef<View>(null);
	const [layout, setLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
	const [isSeeking, setSeek] = useState(false);
	const [isHover, setHover] = useState(false);
	const [isFocus, setFocus] = useState(false);
	const smallBar = !(isSeeking || isHover || isFocus);

	const ts = (value: number) => px(value * size);

	const change = (event: GestureResponderEvent) => {
		event.preventDefault();
		const locationX = Platform.select({
			android: event.nativeEvent.pageX - layout.x,
			default: event.nativeEvent.locationX,
		});
		setProgress(Math.max(0, Math.min(locationX / layout.width, 1)) * max);
	};

	return (
		<View
			ref={ref}
			// @ts-ignore Web only
			onMouseEnter={() => setHover(true)}
			// @ts-ignore Web only
			onMouseLeave={() => {
				setHover(false);
				onHover?.(null, layout);
			}}
			// @ts-ignore Web only
			onMouseMove={(e) =>
				onHover?.(Math.max(0, Math.min((e.clientX - layout.x) / layout.width, 1) * max), layout)
			}
			tabIndex={0}
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
			onResponderStart={change}
			onResponderMove={change}
			onLayout={() =>
				ref.current?.measure((_, __, width, height, pageX, pageY) =>
					setLayout({ width, height, x: pageX, y: pageY }),
				)
			}
			onKeyDown={(e: KeyboardEvent) => {
				switch (e.code) {
					case "ArrowLeft":
						setProgress(Math.max(progress - 0.05 * max, 0));
						break;
					case "ArrowRight":
						setProgress(Math.min(progress + 0.05 * max, max));
						break;
					case "ArrowDown":
						setProgress(Math.max(progress - 0.1 * max, 0));
						break;
					case "ArrowUp":
						setProgress(Math.min(progress + 0.1 * max, max));
						break;
				}
			}}
			{...css(
				{
					paddingVertical: ts(1),
					// @ts-ignore Web only
					cursor: "pointer",
					...focusReset,
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
					smallBar && { transform: "scaleY(0.4)" as any },
				])}
			>
				{subtleProgress !== undefined && (
					<View
						{...css(
							{
								bg: (theme) => theme.overlay1,
								position: "absolute",
								top: 0,
								bottom: 0,
								left: 0,
							},
							{
								style: {
									width: percent((subtleProgress / max) * 100),
								},
							},
						)}
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
							marginY: ts(0.5),
							bg: (theme) => theme.accent,
							width: ts(2),
							height: ts(2),
							borderRadius: ts(1),
							marginLeft: ts(-1),
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
