import { castMediaPlayerShadow, getVideoElement } from "./cast";

const { EventType } = cast.framework.events;

const byId = <T extends HTMLElement = HTMLElement>(id: string): T =>
	document.getElementById(id) as T;

const formatTime = (seconds?: number, reference = seconds): string => {
	if (seconds === undefined || !Number.isFinite(seconds)) return "??:??";
	const pad = (n: number) => Math.floor(n).toString().padStart(2, "0");
	const showHours = seconds >= 3600 || (reference ?? 0) >= 3600;
	const hms = `${pad(seconds / 3600)}:${pad((seconds / 60) % 60)}:${pad(seconds % 60)}`;
	return showHours ? hms : `${pad((seconds / 60) % 60)}:${pad(seconds % 60)}`;
};

export class ReceiverUi {
	#el = {
		overlay: byId("overlay"),
		splash: byId("splash"),
		topTitle: byId("top-title"),
		loading: byId("loading"),
		poster: byId<HTMLImageElement>("poster"),
		title: byId("title"),
		subtitle: byId("subtitle"),
		timeCurrent: byId("time-current"),
		timeTotal: byId("time-total"),
		progressFill: byId("progress-fill"),
		progressBuffer: byId("progress-buffer"),
	};
	#hideTimer: ReturnType<typeof setTimeout> | null = null;

	dismissSplash(): void {
		this.#el.splash.classList.add("gone");
	}

	setMetadata({
		title,
		subtitle,
		poster,
	}: {
		title: string;
		subtitle: string;
		poster: string | null;
	}): void {
		this.#el.topTitle.textContent = title;
		this.#el.title.textContent = title;
		this.#el.subtitle.textContent = subtitle;
		if (poster) {
			this.#el.poster.src = poster;
			this.#el.poster.hidden = false;
		} else {
			this.#el.poster.hidden = true;
		}
	}

	setLoading(isLoading: boolean): void {
		this.#el.loading.style.display = isLoading ? "flex" : "none";
	}

	bindTo(player: framework.PlayerManager): void {
		player.addEventListener(EventType.PLAYER_LOAD_COMPLETE, () => {
			this.setLoading(false);
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
			this.show();
		});
		player.addEventListener(EventType.PAUSE, () => {
			this.show({ sticky: true });
		});
		player.addEventListener(EventType.ERROR, () => {
			this.setLoading(false);
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
		this.#el.timeCurrent.textContent = formatTime(currentTime, dur || undefined);
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
