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

import { useFetch, type QueryIdentifier, imageFn, type Chapter } from "@kyoo/models";
import { Sprite, P, imageBorderRadius, ts } from "@kyoo/primitives";
import { View, Platform } from "react-native";
import { percent, useYoshiki, px, type Theme, useForceRerender } from "yoshiki/native";
import { useMemo } from "react";
import { useAtomValue } from "jotai";
import { durationAtom } from "../state";
import { toTimerString } from "./left-buttons";
import { seekProgressAtom } from "./hover";
import { ErrorView } from "../../errors";

type Thumb = {
	from: number;
	to: number;
	url: string;
	x: number;
	y: number;
	width: number;
	height: number;
};

const parseTs = (time: string) => {
	const times = time.split(":");
	return (
		(Number.parseInt(times[0]) * 3600 +
			Number.parseInt(times[1]) * 60 +
			Number.parseFloat(times[2])) *
		1000
	);
};

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
			const url = lines[i * 2 + 1].split("#xywh=");
			const xywh = url[1].split(",").map((x) => Number.parseInt(x));
			ret[i] = {
				from: parseTs(times[0]),
				to: parseTs(times[1]),
				url: imageFn(url[0]),
				x: xywh[0],
				y: xywh[1],
				width: xywh[2],
				height: xywh[3],
			};
		}
		return ret;
	}, [data]);

	const last = info?.[info.length - 1];
	return {
		info,
		error,
		stats: last
			? {
					rows: last.y / last.height + 1,
					columns: Math.max(...info.map((x) => x.x)) / last.width + 1,
					width: last.width,
					height: last.height,
				}
			: null,
	} as const;
};

useScrubber.query = (url: string): QueryIdentifier<string> => ({
	path: [url, "thumbnails.vtt"],
	parser: null!,
	options: {
		plainText: true,
	},
});

export const ScrubberTooltip = ({
	url,
	chapters,
	seconds,
}: {
	url: string;
	chapters?: Chapter[];
	seconds: number;
}) => {
	const { info, error, stats } = useScrubber(url);
	const { css } = useYoshiki();

	if (error) return <ErrorView error={error} />;

	const current =
		info.findLast((x) => x.from <= seconds * 1000 && seconds * 1000 < x.to) ??
		info.findLast(() => true);
	const chapter = chapters?.findLast((x) => x.startTime <= seconds && seconds < x.endTime);

	return (
		<View
			{...css({
				justifyContent: "center",
				borderRadius: imageBorderRadius,
				overflow: "hidden",
			})}
		>
			{current && (
				<Sprite
					src={current.url}
					alt={""}
					width={current.width}
					height={current.height}
					x={current.x}
					y={current.y}
					columns={stats!.columns}
					rows={stats!.rows}
				/>
			)}
			<P {...css({ textAlign: "center" })}>
				{toTimerString(seconds)} {chapter && `- ${chapter.name}`}
			</P>
		</View>
	);
};
let scrubberWidth = 0;

export const BottomScrubber = ({ url, chapters }: { url: string; chapters?: Chapter[] }) => {
	const { css } = useYoshiki();
	const { info, error, stats } = useScrubber(url);
	const rerender = useForceRerender();

	const progress = useAtomValue(seekProgressAtom) ?? 0;
	const duration = useAtomValue(durationAtom) ?? 1;

	if (error) return <ErrorView error={error} />;

	const width = stats?.width ?? 1;
	const chapter = chapters?.findLast((x) => x.startTime <= progress && progress < x.endTime);
	return (
		<View {...css({ overflow: "hidden" })}>
			<View
				{...(Platform.OS === "web"
					? css({ transform: "translateX(50%)" })
					: {
							// react-native does not support translateX by percentage so we simulate it
							style: { transform: [{ translateX: scrubberWidth / 2 }] },
							onLayout: (e) => {
								if (!e.nativeEvent.layout.width) return;
								scrubberWidth = e.nativeEvent.layout.width;
								rerender();
							},
						})}
			>
				<View
					{...css(
						{ flexDirection: "row" },
						{
							style: {
								transform: `translateX(${
									(progress / duration) * -width * info.length - width / 2
								}px)`,
							},
						},
					)}
				>
					{info.map((thumb) => (
						<Sprite
							key={thumb.to}
							src={thumb.url}
							alt=""
							width={thumb.width}
							height={thumb.height}
							x={thumb.x}
							y={thumb.y}
							columns={stats!.columns}
							rows={stats!.rows}
						/>
					))}
				</View>
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
						color: (theme: Theme) => theme.colors.white,
						bg: (theme) => theme.darkOverlay,
						padding: ts(0.5),
						borderRadius: imageBorderRadius,
					})}
				>
					{toTimerString(progress)}
					{chapter && `\n${chapter.name}`}
				</P>
			</View>
		</View>
	);
};
