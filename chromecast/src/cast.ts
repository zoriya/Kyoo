export type KyooCastData = {
	apiUrl: string;
	slug: string;
	presign?: string;
	clientId: string;
};

export type LocalCast = {
	// urls of the api's video (with show, previous & next) & info
	video: string;
	info: string;
	// urls of the downloaded subtitles by the info's link
	subtitles: Record<string, string>;
	poster: string | null;
	fonts: string[];
};

// CAF passes castData/messages as an object or a JSON string; normalise to an object.
export const asObject = (raw: unknown): Record<string, unknown> | null => {
	if (typeof raw === "string") {
		try {
			return JSON.parse(raw);
		} catch {
			return null;
		}
	}
	return typeof raw === "object" ? (raw as Record<string, unknown>) : null;
};

export const castMediaPlayerShadow = (): ShadowRoot | null =>
	document.querySelector("cast-media-player")?.shadowRoot ?? null;

export const getVideoElement = (): HTMLVideoElement | null =>
	document.getElementsByTagName("video")[0] ??
	castMediaPlayerShadow()?.querySelector("video") ??
	null;
