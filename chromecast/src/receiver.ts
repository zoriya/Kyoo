import { fetchVideoMeta, withPresign } from "./api";
import { asObject, type KyooCastData, OMNI_NAMESPACE } from "./cast";
import { SubtitleManager } from "./subtitles";
import { ReceiverUi } from "./ui";

const { EventType } = cast.framework.events;
const {
	MessageType,
	HlsSegmentFormat,
	HlsVideoSegmentFormat,
	GenericMediaMetadata,
} = cast.framework.messages;

export class KyooReceiver {
	#context = cast.framework.CastReceiverContext.getInstance();
	#player = this.#context.getPlayerManager();
	#playbackConfig = new cast.framework.PlaybackConfig();
	#ui = new ReceiverUi();
	#subtitles = new SubtitleManager(
		document.getElementById("subtitle-layer") as HTMLElement,
	);

	start(): void {
		this.#ui.hideCafChrome();
		this.#ui.bindTo(this.#player);
		this.#subtitles.bindTo(this.#player);

		this.#playbackConfig.initialBandwidth = 20_000_000;
		this.#player.setMessageInterceptor(MessageType.LOAD, this.#onLoad);
		this.#player.setMessageInterceptor(MessageType.EDIT_TRACKS_INFO, (req) => {
			// A native track was picked — drop our custom subtitle.
			if (req.activeTrackIds?.length) this.#subtitles.select(null);
			return req;
		});
		this.#context.addCustomMessageListener(OMNI_NAMESPACE, (event) => {
			// omni sends { subtitle: <track id> | null }.
			const subtitle = asObject(event.data)?.subtitle;
			this.#subtitles.select(typeof subtitle === "string" ? subtitle : null);
		});
		this.#player.addEventListener(EventType.MEDIA_FINISHED, () => {
			this.#subtitles.select(null);
		});
		this.#player.addEventListener(EventType.ERROR, (e) => {
			console.error("[kyoo-receiver] playback error", e);
		});

		const options = new cast.framework.CastReceiverOptions();
		options.playbackConfig = this.#playbackConfig;
		options.maxInactivity = 3600;
		// Register omni's namespace before start() or sender messages may not arrive.
		options.customNamespaces = {
			[OMNI_NAMESPACE]: cast.framework.system.MessageType.JSON,
		};
		this.#context.start(options);
	}

	#onLoad = async (
		request: messages.LoadRequestData,
	): Promise<messages.LoadRequestData> => {
		const data = (asObject(request.media?.customData) as KyooCastData) ?? {};
		this.#subtitles.load(data.apiUrl, data.slug, data.presign);
		this.#ui.clearError();

		this.#ui.dismissSplash();
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

		// Shaka resolves manifest-relative URLs against the pre-redirect URL (#2679);
		// kyoo's master 302-redirects, so follow it and hand Shaka the final URL.
		if (request.media?.contentUrl) {
			try {
				const res = await fetch(request.media.contentUrl, {
					redirect: "follow",
				});
				res.body?.cancel();
				if (res.redirected && res.url) request.media.contentUrl = res.url;
			} catch (e) {
				console.error("[kyoo-receiver] manifest redirect resolve failed", e);
			}
		}

		try {
			const meta = await fetchVideoMeta(data.apiUrl, data.slug, data.presign);
			this.#ui.setMetadata(meta);
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

		return request;
	};
}
