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

import { useFetch, QueryIdentifier, imageFn } from "@kyoo/models";
import { FastImage, P, imageBorderRadius, tooltip, ts } from "@kyoo/primitives";
import { Platform, View } from "react-native";
import { percent, useYoshiki, px, vh } from "yoshiki/native";
import { ErrorView } from "../../fetch";
import { useMemo } from "react";
import { CssObject } from "yoshiki/src/web/generator";
import { useAtomValue } from "jotai";
import { durationAtom, progressAtom } from "../state";
import { toTimerString } from "./left-buttons";

type Thumb = { to: number; url: string; x: number; y: number; width: number; height: number };

export const useScrubber = (url: string) => {
	const { data, error } = useFetch(useScrubber.query(url));
	// TODO: put the info here on the react-query cache to prevent multiples runs of this
	const info = useMemo(() => {
		if (!data) return [];

		const lines = data.split("\n").filter((x) => x);
		lines.shift();
		/* lines now contains something like
		 *
		 * 00:00:00.000 --> 00:00:01.000
		 * image1.png#xywh=0,0,190,120
		 * 00:00:01.000 --> 00:00:02.000
		 * image1.png#xywh=190,0,190,120
		 */

		const ret = new Array<Thumb>(lines.length / 2);
		for (let i = 0; i < ret.length; i++) {
			const times = lines[i * 2].split(" --> ");
			const timesV = times[1].split(":");
			const ts =
				(parseInt(timesV[0]) * 3600 + parseInt(timesV[1]) * 60 + parseFloat(timesV[2])) * 1000;
			const url = lines[i * 2 + 1].split("#xywh=");
			const xywh = url[1].split(",").map((x) => parseInt(x));
			ret[i] = {
				to: ts,
				url: imageFn("/video/" + url[0]),
				x: xywh[0],
				y: xywh[1],
				width: xywh[2],
				height: xywh[3],
			};
		}
		return ret;
	}, [data]);

	return { info, error } as const;
};

useScrubber.query = (url: string): QueryIdentifier<string> => ({
	path: ["video", url, "thumbnails.vtt"],
	parser: null!,
	options: {
		plainText: true,
	},
});

export const BottomScrubber = ({ url }: { url: string }) => {
	const { css } = useYoshiki();
	const { info, error } = useScrubber(url);

	const progress = useAtomValue(progressAtom);
	const duration = useAtomValue(durationAtom);

	if (error) return <ErrorView error={error} />;

	const width = info?.[0]?.width ?? 0;
	return (
		<View {...css({ overflow: "hidden" })}>
			<View
				{...css(
					{ flexDirection: "row" },
					{
						style: {
							transform: `translateX(calc(${
								(progress / duration) * -width * info.length - width / 2
							}px + 50%))`,
						},
					},
				)}
			>
				{info.map((thumb) => (
					<FastImage
						key={thumb.to}
						src={thumb.url}
						alt=""
						width={thumb.width}
						height={thumb.height}
						style={
							Platform.OS === "web"
								? ({
										objectFit: "none",
										objectPosition: `${-thumb.x}px ${-thumb.y}px`,
										flexShrink: 0,
								  } as CssObject)
								: undefined
						}
					/>
				))}
			</View>
			<View
				{...css({
					position: "absolute",
					top: 0,
					bottom: 0,
					left: percent(50),
					right: percent(50),
					width: px(3),
					bg: (theme) => theme.colors.white,
				})}
			/>
			<View
				{...css({
					position: "absolute",
					top: 0,
					bottom: 0,
					left: 0,
					right: 0,
					alignItems: "center",
				})}
			>
				<P
					{...css({
						textAlign: "center",
						color: (theme) => theme.colors.white,
						bg: (theme) => theme.darkOverlay,
						padding: ts(0.5),
						borderRadius: imageBorderRadius,
					})}
				>
					{toTimerString(progress)}
				</P>
			</View>
		</View>
	);
};
