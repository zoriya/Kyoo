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

export type OverlayMetadata = {
	title: string;
	subtitle: string;
	poster: string | null;
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

type ApiImage = { id?: string };

type ApiVideo = {
	path?: string;
	entries?: { name?: string; thumbnail?: ApiImage | null }[];
	show?: {
		name?: string;
		thumbnail?: ApiImage | null;
		poster?: ApiImage | null;
	} | null;
};

export const fetchVideoMeta = async (
	apiUrl: string,
	slug: string,
	token?: string,
) => {
	const res = await fetch(`${apiUrl}/api/videos/${slug}?with=show`, {
		headers: token ? { Authorization: `Bearer ${token}` } : {},
	});
	if (!res.ok) throw new Error(`video request failed: ${res.status}`);
	const data = (await res.json()) as ApiVideo;
	const entry = data.entries?.[0];
	const show = data.show ?? undefined;
	const posterId =
		show?.poster?.id ?? show?.thumbnail?.id ?? entry?.thumbnail?.id ?? null;
	let poster: string | null = null;
	if (posterId) {
		const url = new URL(`${apiUrl}/api/images/${posterId}?quality=high`);
		if (token) url.searchParams.set("session-token", token);
		poster = url.href;
	}
	return {
		title: entry?.name ?? show?.name ?? data.path ?? "",
		subtitle: entry?.name && show?.name ? show.name : "",
		poster,
	};
};
