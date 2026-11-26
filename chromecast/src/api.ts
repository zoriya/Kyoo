import type { KyooCastData, LocalCast } from "./cast";

export type VideoInfo = {
	subtitles: {
		link: string;
		mimeType: string;
		label?: string;
		language?: string;
	}[];
	fonts: string[];
	duration: number | null;
};

export const withPresign = (url: string, presign?: string): string => {
	if (!presign) return url;
	const u = new URL(url);
	u.searchParams.set("x-presign", presign);
	return u.href;
};

export type VideoMeta = {
	videoId: string | null;
	entryId: string | null;
	showName: string;
	entryName: string;
	displayNumber: string;
	title: string;
	poster: string | null;
	blurhash: string | null;
	previousSlug: string | null;
	nextSlug: string | null;
};

export const fetchVideoInfo = async (
	{ apiUrl, slug, presign }: KyooCastData,
	local: LocalCast | null,
): Promise<VideoInfo> => {
	const res = await fetch(
		local
			? local.info
			: withPresign(`${apiUrl}/api/videos/${slug}/info`, presign),
	);
	if (!res.ok) throw new Error(`info request failed: ${res.status}`);
	const data = (await res.json()) as {
		subtitles?: {
			index: number | null;
			title: string | null;
			language: string | null;
			codec: string;
			link: string | null;
		}[];
		fonts?: string[];
		duration?: number | null;
	};

	return {
		subtitles: (data.subtitles ?? [])
			.filter((s) => !!s.link && (!local || s.link in local.subtitles))
			.map((s) => {
				const custom =
					s.codec === "ass" || s.codec === "ssa" || s.codec.includes("pgs");
				const link = new URL(s.link!, apiUrl);
				if (!custom) link.searchParams.set("format", "vtt");
				return {
					link: local
						? local.subtitles[s.link!]
						: withPresign(link.href, presign),
					mimeType: custom ? s.codec : "text/vtt",
					label: s.title ?? undefined,
					language: s.language ?? undefined,
				};
			}),
		fonts: local
			? local.fonts
			: (data.fonts ?? []).map((f) =>
					withPresign(new URL(f, apiUrl).href, presign),
				),
		duration: data.duration ?? null,
	};
};

type ApiImage = { id?: string; blurhash?: string };

type ApiEntry = {
	id?: string;
	kind?: string;
	name?: string | null;
	seasonNumber?: number | null;
	episodeNumber?: number | null;
	number?: number | null;
};

type ApiVideo = {
	id?: string;
	path?: string;
	entries?: ApiEntry[];
	show?: {
		name?: string;
		poster?: ApiImage | null;
	} | null;
	previous?: { video?: string | null } | null;
	next?: { video?: string | null } | null;
};

const entryDisplayNumber = (entry: ApiEntry): string => {
	switch (entry.kind) {
		case "episode":
			if (!entry.seasonNumber) return `SP${entry.episodeNumber}`;
			return `S${entry.seasonNumber}:E${entry.episodeNumber}`;
		case "special":
			return `SP${entry.number}`;
		case "movie":
			return "";
		default:
			return "??";
	}
};

export const fetchVideoMeta = async (
	{ apiUrl, slug, presign }: KyooCastData,
	local: LocalCast | null,
): Promise<VideoMeta> => {
	const res = await fetch(
		local
			? local.video
			: withPresign(
					`${apiUrl}/api/videos/${slug}?with=show,previous,next`,
					presign,
				),
	);
	if (!res.ok) throw new Error(`video request failed: ${res.status}`);
	const data = (await res.json()) as ApiVideo;
	const entry = data.entries?.[0];
	const show = data.show ?? undefined;
	const path = data.path ?? "";
	const poster = show?.poster;

	const displayNumber = entry ? entryDisplayNumber(entry) : "";
	const entryName = entry?.name ?? path;

	return {
		// the sender saves the progress of its download
		videoId: local ? null : (data.id ?? null),
		entryId: local ? null : (entry?.id ?? null),
		showName: show?.name ?? path,
		entryName,
		displayNumber,
		title: entry
			? entry.kind === "movie"
				? entryName
				: `${entryName} (${displayNumber})`
			: path,
		poster: local
			? local.poster
			: poster?.id
				? withPresign(`${apiUrl}/api/images/${poster.id}?quality=high`, presign)
				: null,
		blurhash: poster?.blurhash ?? null,
		previousSlug: data.previous?.video ?? null,
		nextSlug: data.next?.video ?? null,
	};
};
