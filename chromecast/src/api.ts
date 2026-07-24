export type VideoInfo = {
	subtitles: {
		id: string;
		link: string;
		mimeType?: string;
		label?: string;
		language?: string;
	}[];
	fonts: string[];
};

export type VideoMeta = {
	showName: string;
	entryName: string;
	displayNumber: string;
	title: string;
	poster: string | null;
	blurhash: string | null;
	thumbnail: string | null;
};

export const fetchVideoInfo = async (
	apiUrl: string,
	slug: string,
	token?: string,
): Promise<VideoInfo> => {
	const res = await fetch(`${apiUrl}/api/videos/${slug}/info`, {
		headers: token ? { Authorization: `Bearer ${token}` } : {},
	});
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
	};

	return {
		subtitles: (data.subtitles ?? [])
			.map((s, i) => {
				const link = s.link ? new URL(s.link, apiUrl) : null;
				// embed token in query param as jassub doesn't allow us to set headers
				if (link && token) link.searchParams.set("session-token", token);
				return {
					id: String(s.index ?? i),
					link: link?.href ?? "",
					mimeType: s.codec,
					label: s.title ?? undefined,
					language: s.language ?? undefined,
				};
			})
			.filter((s) => !!s.link),
		fonts: (data.fonts ?? []).map((f) => {
			const url = new URL(f, apiUrl);
			if (token) url.searchParams.set("session-token", token);
			return url.href;
		}),
	};
};

type ApiImage = { id?: string; blurhash?: string };

type ApiEntry = {
	kind?: string;
	name?: string | null;
	seasonNumber?: number | null;
	episodeNumber?: number | null;
	number?: number | null;
	thumbnail?: ApiImage | null;
};

type ApiVideo = {
	path?: string;
	entries?: ApiEntry[];
	show?: {
		name?: string;
		poster?: ApiImage | null;
		thumbnail?: ApiImage | null;
	} | null;
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
	apiUrl: string,
	slug: string,
	token?: string,
): Promise<VideoMeta> => {
	const res = await fetch(`${apiUrl}/api/videos/${slug}?with=show`, {
		headers: token ? { Authorization: `Bearer ${token}` } : {},
	});
	if (!res.ok) throw new Error(`video request failed: ${res.status}`);
	const data = (await res.json()) as ApiVideo;
	const entry = data.entries?.[0];
	const show = data.show ?? undefined;
	const path = data.path ?? "";

	const image = (img?: ApiImage | null): string | null => {
		if (!img?.id) return null;
		const url = new URL(`${apiUrl}/api/images/${img.id}?quality=high`);
		if (token) url.searchParams.set("session-token", token);
		return url.href;
	};

	const displayNumber = entry ? entryDisplayNumber(entry) : "";
	const entryName = entry?.name ?? path;
	const posterImg = show?.poster?.id ? show.poster : entry?.thumbnail;

	return {
		showName: show?.name ?? path,
		entryName,
		displayNumber,
		title: entry
			? entry.kind === "movie"
				? entryName
				: `${entryName} (${displayNumber})`
			: path,
		poster: image(posterImg),
		blurhash: posterImg?.blurhash ?? null,
		thumbnail: image(show?.thumbnail) ?? image(show?.poster),
	};
};
