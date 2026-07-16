import JASSUB from "jassub";
// jassub 1.x, not 2.x: 2.x needs OffscreenCanvas + threaded WASM (SharedArrayBuffer),
// absent on Chromecast's Chrome 90; 1.x offers offscreenRender:false + manual setCurrentTime.
import jassubWorkerUrl from "jassub/dist/jassub-worker.js?url";
import jassubWasmUrl from "jassub/dist/jassub-worker.wasm?url";
import jassubLegacyWasmUrl from "jassub/dist/jassub-worker.wasm.js?url";
import { PgsRenderer } from "libpgs";
import libpgsWorkerUrl from "libpgs/dist/libpgs.worker.js?url";
import type { VideoInfo } from "./api";
import { getVideoElement } from "./cast";

type Subtitle = VideoInfo["subtitles"][0];

// ass (jassub) and pgs (libpgs) are drawn by us; vtt/native are left to CAF.
type Format = "ass" | "pgs";

const detectFormat = (subtitle: Subtitle): Format | null => {
	const mime = (subtitle.mimeType ?? "").toLowerCase();
	const ext = subtitle.link.split(/[?#]/)[0]?.split(".").pop()?.toLowerCase();
	if (
		mime.includes("ass") ||
		mime.includes("ssa") ||
		ext === "ass" ||
		ext === "ssa"
	)
		return "ass";
	if (mime.includes("pgs") || ext === "sup") return "pgs";
	return null;
};

// A drawing backend; destroy() stops rendering and releases its worker.
type Renderer = { destroy(): void };

export class SubtitleManager {
	#layer: HTMLElement;
	#video: Promise<HTMLVideoElement>;

	#tracks: Subtitle[] = [];
	#fontUrls: string[] = [];
	#selectedId: string | null = null;

	#renderer: Renderer | null = null;
	#canvas: HTMLCanvasElement | null = null;
	#current: Subtitle | null = null;

	constructor(layer: HTMLElement) {
		this.#layer = layer;
		// The cast <video> only appears once CAF has initialised; poll for it.
		this.#video = new Promise((resolve) => {
			const found = getVideoElement();
			if (found) return resolve(found);
			const timer = setInterval(() => {
				const video = getVideoElement();
				if (video) {
					clearInterval(timer);
					resolve(video);
				}
			}, 200);
		});
	}

	reset(): void {
		this.#tracks = [];
		this.#fontUrls = [];
		this.#selectedId = null;
		this.#teardown();
	}

	setTracks(subtitles: Subtitle[], fonts: string[]): void {
		this.#tracks = subtitles;
		this.#fontUrls = fonts;
		this.#apply();
	}

	select(id: string | null): void {
		this.#selectedId = id;
		this.#apply();
	}

	#apply(): void {
		this.#render(
			(this.#selectedId != null &&
				this.#tracks.find((s) => s.id === this.#selectedId)) ||
				null,
		);
	}

	async #render(subtitle: Subtitle | null): Promise<void> {
		if (!subtitle?.link) return this.#teardown();
		if (this.#current?.link === subtitle.link) return;
		const format = detectFormat(subtitle);
		if (!format) return this.#teardown();

		this.#teardown();
		this.#current = subtitle;

		const video = await this.#video;
		// Selection changed while we waited for the <video> element.
		if (this.#current !== subtitle) return;

		const width = window.innerWidth || video.videoWidth || 1920;
		const height = window.innerHeight || video.videoHeight || 1080;
		const canvas = document.createElement("canvas");
		canvas.width = width;
		canvas.height = height;
		this.#layer.appendChild(canvas);
		this.#canvas = canvas;

		this.#renderer =
			format === "ass"
				? this.#renderAss(video, canvas, subtitle.link, width, height)
				: this.#renderPgs(video, canvas, subtitle.link);
	}

	#renderAss(
		video: HTMLVideoElement,
		canvas: HTMLCanvasElement,
		subUrl: string,
		width: number,
		height: number,
	): Renderer {
		const jassub = new JASSUB({
			video,
			canvas,
			subUrl,
			workerUrl: jassubWorkerUrl,
			wasmUrl: jassubWasmUrl,
			legacyWasmUrl: jassubLegacyWasmUrl,
			offscreenRender: false,
			onDemandRender: false,
			fonts: this.#fontUrls,
		});
		jassub.resize(width, height, 0, 0);

		// rvfc never fires for the composited cast video, so poll currentTime to drive libass.
		let timer: number | null = null;
		const tick = () => {
			jassub.setCurrentTime(
				video.paused,
				video.currentTime,
				video.playbackRate || 1,
			);
			timer = window.setTimeout(tick, 100);
		};
		tick();

		return {
			destroy() {
				if (timer !== null) clearTimeout(timer);
				jassub.destroy();
			},
		};
	}

	#renderPgs(
		video: HTMLVideoElement,
		canvas: HTMLCanvasElement,
		subUrl: string,
	): Renderer {
		const pgs = new PgsRenderer({
			video,
			canvas,
			subUrl,
			aspectRatio: "contain",
			workerUrl: libpgsWorkerUrl,
		});
		return { destroy: () => pgs.dispose() };
	}

	#teardown(): void {
		this.#current = null;
		this.#renderer?.destroy();
		this.#renderer = null;
		this.#canvas?.remove();
		this.#canvas = null;
	}
}
