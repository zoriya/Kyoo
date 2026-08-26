// jassub 1.x, not 2.x: 2.x needs OffscreenCanvas + threaded WASM (SharedArrayBuffer),
// absent on Chromecast's Chrome 90; 1.x offers offscreenRender:false + manual setCurrentTime.
import JASSUB from "jassub";
import jassubDefaultFontUrl from "jassub/dist/default.woff2?url";
import jassubWorkerUrl from "jassub/dist/jassub-worker.js?url";
import jassubWasmUrl from "jassub/dist/jassub-worker.wasm?url";
import jassubLegacyWasmUrl from "jassub/dist/jassub-worker.wasm.js?url";
import { PgsRenderer } from "libpgs";
import libpgsWorkerUrl from "libpgs/dist/libpgs.worker.js?url";
import { getVideoElement } from "./cast";

// A valid but empty WebVTT (`WEBVTT\n\n`), as a data URI. ass/pgs tracks are
// swapped to this so CAF happily holds them "active" (rendering nothing) while
// we draw the real subtitle ourselves as an overlay.
const EMPTY_VTT = "data:text/vtt;base64,V0VCVlRUCgo=";

// ass (jassub) and pgs (libpgs) are drawn by us; vtt/native are left to CAF.
type Format = "ass" | "pgs";

const detectFormat = (
	contentType: string | undefined,
	contentId: string | undefined,
): Format | null => {
	const mime = (contentType ?? "").toLowerCase();
	const ext = (contentId ?? "")
		.split(/[?#]/)[0]
		?.split(".")
		.pop()
		?.toLowerCase();
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

type CustomTrack = { url: string; format: Format };

type Renderer = { destroy(): void };

export class SubtitleManager {
	#layer: HTMLElement;
	#video: Promise<HTMLVideoElement>;
	#tracks = new Map<number, CustomTrack>();
	#fontUrls: string[] = [];

	#renderer: Renderer | null = null;
	#canvas: HTMLCanvasElement | null = null;
	#currentUrl: string | null = null;

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

	// Process the LOAD request's text tracks: record the ass/pgs ones we must
	// draw ourselves (keyed by trackId) and neutralise them to an empty vtt so
	// CAF holds them active harmlessly while we overlay the real subtitle.
	// Native (vtt) tracks are left untouched for CAF.
	registerTracks(tracks: messages.Track[] | undefined): void {
		this.#tracks = new Map();
		for (const track of tracks ?? []) {
			if (track.type !== cast.framework.messages.TrackType.TEXT) continue;
			const format = detectFormat(track.trackContentType, track.trackContentId);
			if (!format) continue;
			this.#tracks.set(track.trackId, {
				url: track.trackContentId ?? "",
				format,
			});
			track.trackContentId = EMPTY_VTT;
			track.trackContentType = "text/vtt";
		}
	}

	setFonts(fonts: string[]): void {
		this.#fontUrls = fonts;
	}

	applyActive(activeTrackIds: number[] | undefined): Promise<void> {
		const custom =
			(activeTrackIds ?? [])
				.map((id) => this.#tracks.get(id))
				.find((t): t is CustomTrack => !!t) ?? null;
		return this.#render(custom).catch((e) =>
			console.error("[kyoo-receiver] failed to render subtitle", e),
		);
	}

	clear(): void {
		this.#tracks = new Map();
		this.#fontUrls = [];
		this.#render(null);
	}

	async #render(track: CustomTrack | null): Promise<void> {
		if (!track?.url) {
			this.#teardown();
			return;
		}
		if (this.#currentUrl === track.url) return;

		this.#teardown();
		this.#currentUrl = track.url;

		const video = await this.#video;
		// Selection changed while we waited for the <video> element.
		if (this.#currentUrl !== track.url) return;

		const width = window.innerWidth || video.videoWidth || 1920;
		const height = window.innerHeight || video.videoHeight || 1080;
		const canvas = document.createElement("canvas");
		canvas.width = width;
		canvas.height = height;
		this.#layer.appendChild(canvas);
		this.#canvas = canvas;

		const renderer =
			track.format === "ass"
				? await this.#renderAss(video, canvas, track.url, width, height)
				: await this.#renderPgs(video, canvas, track.url);
		// selection changed again while the renderer was coming up
		if (this.#currentUrl !== track.url) {
			renderer.destroy();
			return;
		}
		this.#renderer = renderer;
	}

	async #renderAss(
		video: HTMLVideoElement,
		canvas: HTMLCanvasElement,
		subUrl: string,
		width: number,
		height: number,
	): Promise<Renderer> {
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
			availableFonts: { "liberation sans": jassubDefaultFontUrl },
			fallbackFont: "liberation sans",
		});
		// there is no other way to wait for readiness with this old jassub
		await new Promise<void>((resolve) => {
			jassub.addEventListener("ready", () => resolve(), { once: true });
			jassub.addEventListener("error", () => resolve(), { once: true });
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

	async #renderPgs(
		video: HTMLVideoElement,
		canvas: HTMLCanvasElement,
		subUrl: string,
	): Promise<Renderer> {
		const pgs = new PgsRenderer({
			video,
			canvas,
			subUrl,
			aspectRatio: "contain",
			workerUrl: libpgsWorkerUrl,
		});
		await pgs.ready.catch((e) =>
			console.error("[kyoo-receiver] failed to load pgs subtitle", e),
		);
		return { destroy: () => pgs.dispose() };
	}

	#teardown(): void {
		this.#currentUrl = null;
		this.#renderer?.destroy();
		this.#renderer = null;
		this.#canvas?.remove();
		this.#canvas = null;
	}
}
