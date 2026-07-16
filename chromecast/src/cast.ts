export type KyooCastData = {
	apiUrl?: string;
	slug?: string;
	token?: string;
	clientId?: string;
};

// omni's channel for the selected custom (ass/pgs) subtitle; keep in sync with react-native-omni.
export const OMNI_NAMESPACE = "urn:x-cast:dev.zoriya.omni";

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
