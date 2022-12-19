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

import { Chapter } from "@kyoo/models";
import { ts } from "@kyoo/primitives";
import { useAtom, useAtomValue } from "jotai";
import { useEffect, useRef, useState } from "react";
import { NativeTouchEvent, Pressable, Touchable, View } from "react-native";
import { useYoshiki, px, percent } from "yoshiki/native";
import { bufferedAtom, durationAtom, progressAtom } from "../state";

export const ProgressBar = ({ chapters }: { chapters?: Chapter[] }) => {
	return null;
	const { css } = useYoshiki();
	const ref = useRef<View>(null);
	const [isSeeking, setSeek] = useState(false);
	const [progress, setProgress] = useAtom(progressAtom);
	const buffered = useAtomValue(bufferedAtom);
	const duration = useAtomValue(durationAtom);

	const updateProgress = (event: NativeTouchEvent, skipSeek?: boolean) => {
		if (!(isSeeking || skipSeek) || !ref?.current) return;
		const pageX: number = "pageX" in event ? event.pageX : event.changedTouches[0].pageX;
		const value: number = (pageX - ref.current.offsetLeft) / ref.current.clientWidth;
		setProgress(Math.max(0, Math.min(value, 1)) * duration);
	};

	useEffect(() => {
		const handler = () => setSeek(false);

		document.addEventListener("mouseup", handler);
		document.addEventListener("touchend", handler);
		return () => {
			document.removeEventListener("mouseup", handler);
			document.removeEventListener("touchend", handler);
		};
	});
	useEffect(() => {
		document.addEventListener("mousemove", updateProgress);
		document.addEventListener("touchmove", updateProgress);
		return () => {
			document.removeEventListener("mousemove", updateProgress);
			document.removeEventListener("touchmove", updateProgress);
		};
	});

	return (
		<Pressable
			onPointerDown={(event) => {
				// prevent drag and drop of the UI.
				event.preventDefault();
				setSeek(true);
			}}
			onPress={(event) => updateProgress(event.nativeEvent, true)}
			{...css({
				width: percent(100),
				paddingVertical: ts(1),
				cursor: "pointer",
				WebkitTapHighlightColor: "transparent",
				"body.hoverEnabled &:hover": {
					".thumb": { opacity: 1 },
					".bar": { transform: "unset" },
				},
			})}
		>
			<View
				ref={ref}
				className="bar"
				sx={{
					width: "100%",
					height: "4px",
					background: "rgba(255, 255, 255, 0.2)",
					transform: isSeeking ? "unset" : "scaleY(.6)",
					position: "relative",
				}}
			>
				<View
					sx={{
						width: `${(buffered / duration) * 100}%`,
						position: "absolute",
						top: 0,
						bottom: 0,
						left: 0,
						background: "rgba(255, 255, 255, 0.5)",
					}}
				/>
				<View
					sx={{
						width: `${(progress / duration) * 100}%`,
						position: "absolute",
						top: 0,
						bottom: 0,
						left: 0,
						background: (theme) => theme.palette.primary.main,
					}}
				/>
				<View
					className="thumb"
					sx={{
						position: "absolute",
						left: `calc(${(progress / duration) * 100}% - 6px)`,
						top: 0,
						bottom: 0,
						margin: "auto",
						opacity: +isSeeking,
						width: "12px",
						height: "12px",
						borderRadius: "6px",
						background: (theme) => theme.palette.primary.main,
					}}
				/>

				{chapters?.map((x) => (
					<View
						key={x.startTime}
						{...css({
							position: "absolute",
							width: px(4),
							top: 0,
							bottom: 0,
							left: `${Math.min(100, (x.startTime / duration) * 100)}%`,
							bg: (theme) => theme.accent,
						})}
					/>
				))}
			</View>
		</Pressable>
	);
};
