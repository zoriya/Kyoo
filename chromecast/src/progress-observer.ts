import type { KyooCastData } from "./cast";

const { EventType } = cast.framework.events;
const { PlayerState } = cast.framework.messages;

type Ids = { videoId: string; entryId: string; duration: number | null };

// mirrors the app's `useProgressObserver` (front/src/ui/player/progress-observer.ts):
export class ProgressObserver {
	#player: framework.PlayerManager;
	#ws: WebSocket | null = null;
	#wsUrl: string | null = null;
	#ids: Ids | null = null;
	#interval: ReturnType<typeof setInterval> | null = null;
	#ping: ReturnType<typeof setInterval> | null = null;
	#reconnect: ReturnType<typeof setTimeout> | null = null;

	constructor(player: framework.PlayerManager) {
		this.#player = player;
	}

	start(): void {
		this.#player.addEventListener(EventType.PLAYING, this.#sync);
		this.#player.addEventListener(EventType.PAUSE, this.#sync);
		this.#player.addEventListener(EventType.MEDIA_FINISHED, (e) => {
			if (this.#interval !== null) {
				clearInterval(this.#interval);
				this.#interval = null;
			}
			if (e.endedReason === "END_OF_STREAM") this.#send(true);
		});
	}

	// Called on every LOAD once the video/entry ids and presign are known.
	load(data: KyooCastData, ids: Ids): void {
		this.#ids = ids;

		let url = `${data.apiUrl.replace(/^http/, "ws")}/api/ws`;
		if (data.presign) url += `?x-presign=${encodeURIComponent(data.presign)}`;

		if (url !== this.#wsUrl) {
			this.#wsUrl = url;
			this.#connect();
		}
	}

	#connect = (): void => {
		if (!this.#wsUrl) return;
		this.#close();

		const ws = new WebSocket(this.#wsUrl, "kyoo");
		this.#ws = ws;

		ws.addEventListener("open", () => {
			this.#ping = setInterval(() => {
				if (ws.readyState === WebSocket.OPEN)
					ws.send(JSON.stringify({ action: "ping" }));
			}, 25_000);
		});
		ws.addEventListener("close", () => {
			if (this.#ws !== ws) return;
			this.#close();
			this.#ws = null;
			if (this.#wsUrl) {
				this.#reconnect = setTimeout(this.#connect, 5_000);
			}
		});
		ws.addEventListener("error", (e) => {
			console.error("[kyoo-receiver] progress websocket error", e);
		});
	};

	#sync = (): void => {
		this.#send();
		if (this.#player.getPlayerState() === PlayerState.PLAYING) {
			if (this.#interval === null)
				this.#interval = setInterval(this.#send, 5_000);
		} else if (this.#interval !== null) {
			clearInterval(this.#interval);
			this.#interval = null;
		}
	};

	#send = (finished?: boolean): void => {
		if (!this.#ids || !this.#ws || this.#ws.readyState !== WebSocket.OPEN)
			return;
		if (!finished && this.#player.getPlayerState() === PlayerState.IDLE) return;
		const time = this.#player.getCurrentTimeSec();
		const duration = this.#ids.duration ?? this.#player.getDurationSec();
		if (!Number.isFinite(duration) || duration <= 0) return;
		if (!finished && !Number.isFinite(time)) return;
		this.#ws.send(
			JSON.stringify({
				action: "watch",
				entry: this.#ids.entryId,
				videoId: this.#ids.videoId,
				percent: finished
					? 100
					: Math.min(100, Math.max(0, Math.round((time / duration) * 100))),
				time: finished ? Math.round(duration) : Math.max(0, Math.round(time)),
			}),
		);
	};

	#close = (): void => {
		if (this.#ping !== null) {
			clearInterval(this.#ping);
			this.#ping = null;
		}
		if (this.#reconnect !== null) {
			clearTimeout(this.#reconnect);
			this.#reconnect = null;
		}
		if (this.#ws) {
			this.#ws.close();
			this.#ws = null;
		}
	};
}
