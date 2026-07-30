import { decode } from "blurhash";
import { castMediaPlayerShadow, getVideoElement } from "./cast";

const { EventType, DetailedErrorCode } = cast.framework.events;

const byId = <T extends HTMLElement = HTMLElement>(id: string): T =>
	document.getElementById(id) as T;

const blurhashToDataUrl = (
	hash: string | null,
	width = 32,
	height = 48,
): string | null => {
	if (!hash) return null;
	try {
		const pixels = decode(hash, width, height);
		const canvas = document.createElement("canvas");
		canvas.width = width;
		canvas.height = height;
		const ctx = canvas.getContext("2d");
		if (!ctx) return null;
		const imageData = ctx.createImageData(width, height);
		imageData.data.set(pixels);
		ctx.putImageData(imageData, 0, 0);
		return canvas.toDataURL();
	} catch {
		return null;
	}
};

const formatTime = (seconds?: number, reference = seconds): string => {
	if (seconds === undefined || !Number.isFinite(seconds)) return "??:??";
	const pad = (n: number) => Math.floor(n).toString().padStart(2, "0");
	const showHours = seconds >= 3600 || (reference ?? 0) >= 3600;
	const hms = `${pad(seconds / 3600)}:${pad((seconds / 60) % 60)}:${pad(seconds % 60)}`;
	return showHours ? hms : `${pad((seconds / 60) % 60)}:${pad(seconds % 60)}`;
};

const describeError = (e: framework.events.ErrorEvent): string => {
	const C = DetailedErrorCode;
	switch (e.detailedErrorCode) {
		case C.LOAD_FAILED:
		case C.LOAD_INTERRUPTED:
			return "Could not load this video. It may be unavailable or you may not be signed in.";
		case C.MEDIA_SRC_NOT_SUPPORTED:
		case C.MEDIA_UNKNOWN:
			return "This video format is not supported by your Chromecast.";
		case C.MEDIA_DECODE:
		case C.SOURCE_BUFFER_FAILURE:
			return "Your Chromecast could not decode this video.";
		case C.NETWORK_UNKNOWN:
		case C.SEGMENT_NETWORK:
		case C.HLS_NETWORK_MASTER_PLAYLIST:
		case C.HLS_NETWORK_PLAYLIST:
		case C.HLS_NETWORK_KEY_LOAD:
		case C.HLS_NETWORK_INVALID_SEGMENT:
		case C.DASH_NETWORK:
			return "Network error while streaming. Check the connection to your server.";
		case C.MANIFEST_UNKNOWN:
		case C.HLS_MANIFEST_MASTER:
		case C.HLS_MANIFEST_PLAYLIST:
		case C.DASH_MANIFEST_UNKNOWN:
		case C.DASH_MANIFEST_NO_PERIODS:
		case C.DASH_MANIFEST_NO_MIMETYPE:
			return "The video stream could not be read (invalid manifest).";
		case C.HLS_SEGMENT_PARSING:
		case C.SEGMENT_UNKNOWN:
			return "A video segment failed to load or parse.";
		default:
			return `Playback failed (error ${e.detailedErrorCode ?? "unknown"}).`;
	}
};

const stringifyError = (value: unknown): string => {
	if (value == null) return "";
	if (value instanceof Error)
		return value.stack ?? `${value.name}: ${value.message}`;
	if (typeof value !== "object") return String(value);
	const seen = new WeakSet<object>();
	try {
		return JSON.stringify(
			value,
			(_key, val) => {
				if (val instanceof Error)
					return { name: val.name, message: val.message, stack: val.stack };
				if (typeof val === "object" && val !== null) {
					if (seen.has(val)) return "[Circular]";
					seen.add(val);
				}
				return val;
			},
			2,
		);
	} catch {
		return String(value);
	}
};

const errorDetail = (e: framework.events.ErrorEvent): string => {
	const parts: string[] = [];
	if (e.detailedErrorCode != null)
		parts.push(`detailedErrorCode: ${e.detailedErrorCode}`);
	const underlying = stringifyError(
		(e as unknown as { error?: unknown }).error,
	);
	if (underlying) parts.push(underlying);
	return parts.join("\n");
};

export class ReceiverUi {
	#el = {
		overlay: byId("overlay"),
		splash: byId("splash"),
		topTitle: byId("top-title"),
		loading: byId("loading"),
		poster: byId<HTMLImageElement>("poster"),
		title: byId("title"),
		timeCurrent: byId("time-current"),
		timeTotal: byId("time-total"),
		progressFill: byId("progress-fill"),
		progressBuffer: byId("progress-buffer"),
		error: byId("error"),
		errorTitle: byId("error-title"),
		errorMessage: byId("error-message"),
		errorDetail: byId("error-detail"),
	};
	#hideTimer: ReturnType<typeof setTimeout> | null = null;

	dismissSplash(): void {
		this.#el.splash.classList.add("gone");
	}

	setMetadata({
		showName,
		entryName,
		displayNumber,
		poster,
		blurhash,
	}: {
		showName: string;
		entryName: string;
		displayNumber: string;
		poster: string | null;
		blurhash: string | null;
	}): void {
		this.#el.topTitle.textContent = showName;
		this.#el.title.textContent = [displayNumber, entryName].join(" - ");
		if (poster) {
			const placeholder = blurhashToDataUrl(blurhash);
			this.#el.poster.style.backgroundImage = placeholder
				? `url(${placeholder})`
				: "";
			this.#el.poster.src = poster;
			this.#el.poster.hidden = false;
		} else {
			this.#el.poster.hidden = true;
			this.#el.poster.removeAttribute("src");
			this.#el.poster.style.backgroundImage = "";
		}
	}

	setLoading(isLoading: boolean): void {
		this.#el.loading.style.display = isLoading ? "flex" : "none";
	}

	showError(message: string, detail = "", title = "Playback error"): void {
		this.setLoading(false);
		this.#el.errorTitle.textContent = title;
		this.#el.errorMessage.textContent = message;
		this.#el.errorDetail.textContent = detail;
		this.#el.errorDetail.hidden = !detail;
		this.#el.error.hidden = false;
	}

	clearError(): void {
		this.#el.error.hidden = true;
	}

	bindTo(player: framework.PlayerManager): void {
		player.addEventListener(EventType.PLAYER_LOAD_COMPLETE, () => {
			this.setLoading(false);
			this.clearError();
			this.#syncProgress(player);
			this.show();
		});
		player.addEventListener(EventType.TIME_UPDATE, () =>
			this.#syncProgress(player),
		);
		player.addEventListener(EventType.BUFFERING, (e) => {
			this.setLoading(e.isBuffering === true);
		});
		player.addEventListener(EventType.PLAYING, () => {
			this.setLoading(false);
			this.clearError();
			this.show();
		});
		player.addEventListener(EventType.PAUSE, () => {
			this.show({ sticky: true });
		});
		player.addEventListener(EventType.ERROR, (e) => {
			this.showError(describeError(e), errorDetail(e));
		});
	}

	#syncProgress(player: framework.PlayerManager): void {
		const video = getVideoElement();
		let buffered = Number.NaN;
		try {
			if (video?.buffered.length)
				buffered = video.buffered.end(video.buffered.length - 1);
		} catch {
			// buffered stays NaN
		}
		const currentTime = player.getCurrentTimeSec();
		const duration = player.getDurationSec();
		const dur = Number.isFinite(duration) && duration > 0 ? duration : 0;
		const percent = dur ? Math.min(100, (currentTime / dur) * 100) : 0;
		this.#el.progressFill.style.width = `${percent}%`;
		if (Number.isFinite(buffered) && dur) {
			this.#el.progressBuffer.style.width = `${Math.min(100, (buffered / dur) * 100)}%`;
		}
		this.#el.timeCurrent.textContent = formatTime(
			currentTime,
			dur || undefined,
		);
		this.#el.timeTotal.textContent = formatTime(dur || undefined);
	}

	show({ sticky = false }: { sticky?: boolean } = {}): void {
		this.#el.overlay.style.opacity = "1";
		if (this.#hideTimer) clearTimeout(this.#hideTimer);
		if (!sticky) {
			this.#hideTimer = setTimeout(() => {
				this.#el.overlay.style.opacity = "0";
			}, 5000);
		}
	}

	// Hide CAF's own controls/splash/logo/spinner so only our overlay shows; its
	// shadow root appears only after CAF init, so poll for it.
	hideCafChrome(): void {
		const inject = () => {
			const root = castMediaPlayerShadow();
			if (!root) return false;
			if (root.getElementById("kyoo-hide")) return true;
			const style = document.createElement("style");
			style.id = "kyoo-hide";
			style.textContent =
				"tv-overlay,.spinner,#logo,#splash,.slideshow{display:none!important}";
			root.appendChild(style);
			return true;
		};
		const timer = setInterval(() => {
			if (inject()) clearInterval(timer);
		}, 200);
	}
}
