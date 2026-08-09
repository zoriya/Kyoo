import { parse, stringify } from "hls-parser";
import { fetchVideoInfo, fetchVideoMeta, withPresign } from "./api";
import { asObject, type KyooCastData } from "./cast";
import { ProgressObserver } from "./progress-observer";
import { SubtitleManager } from "./subtitles";
import { ReceiverUi } from "./ui";

const { EventType, DetailedErrorCode } = cast.framework.events;
const {
	MessageType,
	HlsSegmentFormat,
	HlsVideoSegmentFormat,
	GenericMediaMetadata,
	Track,
	TrackType,
	TextTrackType,
} = cast.framework.messages;

export const filterMasterPlaylist = (
	text: string,
	baseUrl: string,
): string | null => {
	console.log("parsing manifest:", text);
	const playlist = parse(text);
	if (!playlist.isMasterPlaylist) return null;

	const supported = playlist.variants.filter(
		(v) =>
			!v.codecs ||
			MediaSource.isTypeSupported(`video/mp4; codecs="${v.codecs}"`) ||
			MediaSource.isTypeSupported(`audio/mp4; codecs="${v.codecs}"`),
	);

	if (supported.length === 0) return null;

	// the device can't switch video codec mid-stream, so keep a single ladder:
	// the codec with the most variants (ties keep the first, ie the original).
	const ladders = new Map<string, typeof supported>();
	for (const v of supported) {
		const codec = (v.codecs ?? "").split(",")[0].split(".")[0];
		const ladder = ladders.get(codec);
		if (ladder) ladder.push(v);
		else ladders.set(codec, [v]);
	}
	const kept = [...ladders.values()].reduce((a, b) =>
		b.length > a.length ? b : a,
	);

	if (kept.length === playlist.variants.length) return null;
	playlist.variants = kept;

	// data: URLs have no base to resolve against, so absolutize every URI.
	for (const v of playlist.variants) {
		v.uri = new URL(v.uri, baseUrl).href;
		for (const r of [...v.audio, ...v.video, ...v.subtitles])
			if (r.uri) r.uri = new URL(r.uri, baseUrl).href;
	}
	const ret = stringify(playlist);
	console.log("stripped manifest:", ret);
	return ret;
};

export class KyooReceiver {
	#context = cast.framework.CastReceiverContext.getInstance();
	#player = this.#context.getPlayerManager();
	#playbackConfig = new cast.framework.PlaybackConfig();
	#ui = new ReceiverUi();
	#subtitles = new SubtitleManager(
		document.getElementById("subtitle-layer") as HTMLElement,
	);
	#progress = new ProgressObserver(this.#player);

	start(): void {
		this.#ui.hideCafChrome();
		this.#ui.bindTo(this.#player);
		this.#progress.start();

		this.#playbackConfig.initialBandwidth = 20_000_000;
		this.#player.setMessageInterceptor(MessageType.LOAD, this.#onLoad);
		this.#player.setMessageInterceptor(
			MessageType.MEDIA_STATUS,
			this.#onStatus,
		);
		this.#player.setMessageInterceptor(MessageType.EDIT_TRACKS_INFO, (req) => {
			this.#subtitles.applyActive(req.activeTrackIds);
			return req;
		});
		this.#player.addEventListener(EventType.MEDIA_FINISHED, (e) => {
			this.#subtitles.clear();
			if (e.endedReason === "ERROR") this.#player.stop();
		});
		this.#player.addEventListener(EventType.ERROR, (e) => {
			if (e.detailedErrorCode === DetailedErrorCode.LOAD_INTERRUPTED) {
				console.log("[kyoo-receiver] load interrupted by a newer one");
				return;
			}
			console.error("[kyoo-receiver] playback error", e);
			this.#player.stop();
		});

		const options = new cast.framework.CastReceiverOptions();
		options.playbackConfig = this.#playbackConfig;
		options.maxInactivity = 3600;
		this.#context.start(options);
	}

	// cast messages are capped at 64kb. strip all unnecessary data (and presigns)
	#onStatus = (status: messages.MediaStatus): messages.MediaStatus => {
		if (!status.media) return status;
		const copy = <T extends object>(obj: T): T =>
			Object.assign(Object.create(Object.getPrototypeOf(obj)), obj);
		const strip = (media: messages.MediaInformation) => {
			const data = asObject(media.customData) as KyooCastData | null;
			const stripped = copy(media);
			stripped.contentUrl =
				data?.apiUrl && data?.slug
					? `${data.apiUrl}/api/videos/${data.slug}/master.m3u8`
					: undefined;
			stripped.customData = undefined;
			stripped.tracks = media.tracks?.map((track) => {
				const copied = copy(track);
				copied.trackContentId = undefined;
				return copied;
			});
			return stripped;
		};

		const stripped = copy(status);
		stripped.media = strip(status.media);
		stripped.items = status.items?.map((item) => {
			if (!item.media) return item;
			const copied = copy(item);
			copied.media = strip(item.media);
			return copied;
		});
		return stripped;
	};

	#onLoad = async (
		request: messages.LoadRequestData,
	): Promise<messages.LoadRequestData> => {
		const data = (asObject(request.media?.customData) as KyooCastData) ?? {};

		this.#ui.clearError();
		this.#ui.dismissSplash();
		this.#ui.clearMetadata();
		this.#ui.setPaused(false);
		this.#ui.setLoading(true);
		this.#ui.show({ sticky: true });

		if (request.media && data.apiUrl && data.slug) {
			request.media.contentUrl = withPresign(
				`${data.apiUrl}/api/videos/${data.slug}/master.m3u8?clientId=${data.clientId}`,
				data.presign,
			);
			request.media.contentType = "application/vnd.apple.mpegurl";
			request.media.hlsSegmentFormat = HlsSegmentFormat.FMP4;
			request.media.hlsVideoSegmentFormat = HlsVideoSegmentFormat.FMP4;
		}

		// Fetch the master ourselves to:
		// - resolve the 302 (relative urls resolve against the pre-redirect url)
		//   (https://github.com/shaka-project/shaka-player/issues/2679)
		// - drop variants the device can't decode
		//   (https://github.com/shaka-project/shaka-player/issues/9211)
		if (request.media?.contentUrl) {
			try {
				const res = await fetch(request.media.contentUrl, {
					redirect: "follow",
				});
				const finalUrl =
					res.redirected && res.url ? res.url : request.media.contentUrl;
				const filtered = filterMasterPlaylist(await res.text(), finalUrl);
				request.media.contentUrl = filtered
					? `data:application/vnd.apple.mpegurl,${encodeURIComponent(filtered)}`
					: finalUrl;
			} catch (e) {
				console.error("[kyoo-receiver] manifest fetch/filter failed", e);
			}
		}

		if (data.apiUrl && data.slug) {
			try {
				const info = await fetchVideoInfo(data.apiUrl, data.slug, data.presign);
				this.#subtitles.setFonts(info.fonts);
				if (request.media) {
					request.media.tracks = info.subtitles.map((sub, i) => {
						// caf tracks are 1 based instead of 0 based
						const track = new Track(i + 1, TrackType.TEXT);
						track.trackContentId = sub.link;
						track.trackContentType = sub.mimeType;
						track.subtype = TextTrackType.SUBTITLES;
						track.name = sub.label;
						track.language = sub.language;
						return track;
					});
				}
			} catch (e) {
				console.error("[kyoo-receiver] failed to load subtitles", e);
			}
		}

		this.#subtitles.registerTracks(request.media?.tracks);
		this.#subtitles.applyActive(request.activeTrackIds);

		if (data.apiUrl && data.slug) {
			try {
				const meta = await fetchVideoMeta(data.apiUrl, data.slug, data.presign);
				this.#ui.setMetadata(meta);
				if (meta.videoId && meta.entryId) {
					this.#progress.load(data, {
						videoId: meta.videoId,
						entryId: meta.entryId,
					});
				}
				if (request.media) {
					const metadata = new GenericMediaMetadata();
					metadata.title = meta.title;
					if (meta.showName) metadata.subtitle = meta.showName;
					if (meta.poster) metadata.images = [{ url: meta.poster }];
					request.media.metadata = metadata;
				}
			} catch (e) {
				console.error("[kyoo-receiver] failed to load metadata", e);
			}
		}

		return request;
	};
}
