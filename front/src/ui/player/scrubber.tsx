import { useMemo, useState } from "react";
import { View } from "react-native";
import { useEvent, type VideoPlayer } from "react-native-video";
import type { Chapter } from "~/models";
import { P, Sprite } from "~/primitives";
import { useToken } from "~/providers/account-context";
import { type QueryIdentifier, useFetch } from "~/query";
import { useQueryState } from "~/utils";
import { toTimerString } from "./controls/progress";

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
		(Number.parseInt(times[0], 10) * 3600 +
			Number.parseInt(times[1], 10) * 60 +
			Number.parseFloat(times[2])) *
		1000
	);
};

export const useScrubber = (videoSlug: string) => {
	const { apiUrl } = useToken();
	const { data } = useFetch(useScrubber.query(videoSlug));

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
			const xywh = url[1].split(",").map((x) => Number.parseInt(x, 10));
			ret[i] = {
				from: parseTs(times[0]),
				to: parseTs(times[1]),
				url: `${apiUrl}${url[0]}`,
				x: xywh[0],
				y: xywh[1],
				width: xywh[2],
				height: xywh[3],
			};
		}
		return ret;
	}, [apiUrl, data]);

	const last = info?.[info.length - 1];
	return {
		info,
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

useScrubber.query = (videoSlug: string): QueryIdentifier<string> => ({
	path: ["api", "videos", videoSlug, "thumbnails.vtt"],
	parser: null!,
	options: {
		plainText: true,
	},
});

export const ScrubberTooltip = ({
	videoSlug,
	chapters,
	seconds,
}: {
	videoSlug: string;
	chapters?: Chapter[];
	seconds: number;
}) => {
	const { info, stats } = useScrubber(videoSlug);

	const current =
		info.findLast((x) => x.from <= seconds * 1000 && seconds * 1000 < x.to) ??
		info.findLast(() => true);
	const chapter = chapters?.findLast(
		(x) => x.startTime <= seconds && seconds < x.endTime,
	);

	return (
		<View className="justify-center overflow-hidden rounded bg-slate-200">
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
			<P className="text-center">
				{toTimerString(seconds)} {chapter && `- ${chapter.name}`}
			</P>
		</View>
	);
};

export const BottomScrubber = ({
	chapters,
	seek,
	player,
}: {
	chapters?: Chapter[];
	seek: number;
	player: VideoPlayer;
}) => {
	const [slug] = useQueryState<string>("slug", undefined!);
	const { info, stats } = useScrubber(slug);

	const [duration, setDuration] = useState(player.duration);
	useEvent(player, "onLoad", (info) => {
		if (info.duration) setDuration(info.duration);
	});

	const width = stats?.width ?? 1;
	const chapter = chapters?.findLast(
		(x) => x.startTime <= seek && seek < x.endTime,
	);
	return (
		<View className="overflow-hidden">
			<View className="flex-1 translate-x-1/2">
				<View
					className="flex-1 flex-row"
					style={{
						transform: `translateX(${
							(seek / duration) * -width * info.length - width / 2
						}px)`,
					}}
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
			<View className="absolute top-0 right-1/2 bottom-0 left-1/2 w-1 bg-slate-200" />
			<View className="absolute inset-0 items-center">
				<P className="rounded bg-slate-800 p-1 text-center text-slate-200 dark:text-slate-200">
					{toTimerString(seek)}
					{chapter && `\n${chapter.name}`}
				</P>
			</View>
		</View>
	);
};
