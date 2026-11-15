import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { usePlayerState } from "react-native-omni";
import type { Chapter } from "~/models";
import { P, Sprite, SubP } from "~/primitives";
import { useToken } from "~/providers/account-context";
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
	const { apiUrl, authToken } = useToken();
	const [vtt, setVtt] = useState<string>();
	useEffect(() => {
		const abort = new AbortController();
		(async () => {
			const res = await fetch(
				`${apiUrl}/api/videos/${videoSlug}/thumbnails.vtt`,
				{
					headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
					signal: abort.signal,
				},
			).catch(() => null);
			const text = res?.ok ? await res.text().catch(() => null) : null;
			if (text) setVtt(text);
		})();
		return () => abort.abort();
	}, [apiUrl, authToken, videoSlug]);

	const info = useMemo(() => {
		if (!vtt) return [];

		const lines = vtt.split("\n").filter((x) => x);
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
	}, [apiUrl, vtt]);

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

export const ScrubberTooltip = ({
	scrubber: { info, stats },
	chapters,
	seconds,
}: {
	scrubber: ReturnType<typeof useScrubber>;
	chapters?: Chapter[];
	seconds: number;
}) => {
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

export const BottomScrubber = ({
	chapters,
	seek,
}: {
	chapters?: Chapter[];
	seek: number;
}) => {
	const [slug] = useQueryState<string>("slug", undefined!);
	const { info, stats } = useScrubber(slug);
	const { t } = useTranslation();

	const duration = usePlayerState("duration");
	const [viewportWidth, setViewportWidth] = useState(0);

	const width = stats?.width ?? 1;
	const offset = duration ? (seek / duration) * width * info.length : 0;
	const chapter = chapters?.findLast(
		(x) => x.startTime <= seek && seek < x.endTime,
	);

	const sprites = useMemo(
		() =>
			info.map((thumb) => (
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
			)),
		[info, stats],
	);

	return (
		<View
			className="overflow-hidden"
			onLayout={(e) => setViewportWidth(e.nativeEvent.layout.width)}
		>
			<View
				className="flex-row"
				style={{
					transform: [{ translateX: viewportWidth / 2 - offset - width / 2 }],
				}}
			>
				{sprites}
			</View>
			<View className="absolute top-0 right-1/2 bottom-0 left-1/2 w-1 bg-slate-200" />
			<View className="absolute inset-0 items-center">
				<P className="rounded bg-slate-800 p-1 text-center text-slate-200 dark:text-slate-200">
					{toTimerString(seek)}
					{chapter && `\n${chapter.name}`}
				</P>
				{chapter && chapter.type !== "content" && (
					<SubP>{t(`player.chapters.${chapter.type}`)}</SubP>
				)}
			</View>
		</View>
	);
};
