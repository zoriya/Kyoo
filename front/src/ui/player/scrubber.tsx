import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import type { Chapter } from "~/models";
import { P, Sprite, SubP } from "~/primitives";
import { useToken } from "~/providers/account-context";
import { type QueryIdentifier, useFetch } from "~/query";
import { toTimerString } from "./controls/progress";

export type Thumb = {
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
	const { t } = useTranslation();

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
				{toTimerString(seconds)} {chapter?.name && `- ${chapter.name}`}
			</P>
			{chapter && chapter.type !== "content" && (
				<SubP>{t(`player.chapters.${chapter.type}`)}</SubP>
			)}
		</View>
	);
};
