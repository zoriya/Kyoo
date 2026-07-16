import { fetchVideoInfo, fetchVideoMeta } from "./api";
import { asObject, type KyooCastData, OMNI_NAMESPACE } from "./cast";
import { SubtitleManager } from "./subtitles";
import { ReceiverUi } from "./ui";

const { EventType } = cast.framework.events;
const { MessageType, HlsSegmentFormat, HlsVideoSegmentFormat } =
	cast.framework.messages;

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
		const data =
			(asObject(request.media?.customData) as KyooCastData | null) ?? {};
		this.#subtitles.reset();

		if (data.token) {
			const authed: RequestHandler = (req) => {
				req.headers = { ...req.headers, Authorization: `Bearer ${data.token}`  };
			};
			this.#playbackConfig.manifestRequestHandler = authed;
			this.#playbackConfig.segmentRequestHandler = authed;
			this.#playbackConfig.licenseRequestHandler = authed;
		}

		this.#ui.dismissSplash();
		this.#ui.setLoading(true);
		this.#ui.show({ sticky: true });

		if (request.media && data.apiUrl && data.slug) {
			request.media.contentUrl = `${data.apiUrl}/api/videos/${data.slug}/master.m3u8?clientId=${data.clientId}`;
			request.media.contentType = "application/vnd.apple.mpegurl";
			request.media.hlsSegmentFormat = HlsSegmentFormat.FMP4;
			request.media.hlsVideoSegmentFormat = HlsVideoSegmentFormat.FMP4;
		}

		// Shaka resolves manifest-relative URLs against the pre-redirect URL (#2679);
		// kyoo's master 302-redirects, so follow it and hand Shaka the final URL.
		if (request.media?.contentUrl) {
			try {
				const res = await fetch(request.media.contentUrl, {
					headers: { Authorization: `Bearer ${data.token}` },
					redirect: "follow",
				});
				res.body?.cancel();
				if (res.redirected && res.url) request.media.contentUrl = res.url;
			} catch (e) {
				console.error("[kyoo-receiver] manifest redirect resolve failed", e);
			}
		}

		this.#loadMetadata(data);
		return request;
	};

	async #loadMetadata(data: KyooCastData): Promise<void> {
		if (!data.apiUrl || !data.slug) return;
		try {
			const [info, meta] = await Promise.all([
				fetchVideoInfo(data.apiUrl, data.slug, data.token),
				fetchVideoMeta(data.apiUrl, data.slug, data.token),
			]);
			this.#subtitles.setTracks(info.subtitles, info.fonts);
			this.#ui.setMetadata(meta);
		} catch (e) {
			console.error("[kyoo-receiver] failed to load video data", e);
		}
	}
}
