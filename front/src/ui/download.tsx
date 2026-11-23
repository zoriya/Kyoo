import { StateContext } from "@data-client/react";
import { decode, encode } from "@msgpack/msgpack";
import { type NativeModule, requireOptionalNativeModule } from "expo";
import { File } from "expo-file-system";
import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useEffectEvent,
	useState,
} from "react";
import { useTranslation } from "react-i18next";
import { PermissionsAndroid, Platform } from "react-native";
import { createMMKV, useMMKVListener, useMMKVNumber } from "react-native-mmkv";
import { v4 as uuidv4 } from "uuid";
import { entryDisplayNumber } from "~/components/entries";
import { type QueryIdentifier, useMutation, usePrefill } from "~/data";
import type { Quality, Show, Video, VideoInfo } from "~/models";
import { useAlert } from "~/primitives";
import { useAccount, useToken } from "~/providers/account-context";
import { Header } from "~/ui/details/header";
import { Info } from "~/ui/info";
import { base64UrlPath, Player } from "~/ui/player";
import { useSetting } from "~/ui/settings/base";
import { availableQualities, QualityPopup } from "./downloads/quality";

// browsers have their own downloads, tvs don't need them.
// ios needs its own version of modules/kyoo-downloads
export const canDownload = Platform.OS === "android" && !Platform.isTV;

export type Download = {
	id: string;
	slug: string;
	apiUrl: string;
	// the account (or "guest") reading it
	owner: string;
	status:
		| "pending"
		| "preparing"
		| "queued"
		| "downloading"
		| "paused"
		| "done"
		| "failed";
	quality: Quality;
	size: number | null;
	error?: string | null;
	file: string;
	createdAt: number;
	video: Video;
	info: VideoInfo;
	show: Show | null;
};

// one per video & file, shared by every account of the server
type StoredDownload = Omit<Download, "owner" | "video" | "show"> & {
	owners: Record<string, Pick<Download, "video" | "show">>;
};

type NativeDownload = {
	id: string;
	status: Download["status"];
	// percent prepared by the server
	progress?: number;
	bytes?: number;
	total?: number;
	error?: string;
};

export type DownloadSettings = {
	maxConcurrent: number;
	allowCellular: boolean;
};

declare class KyooDownloads extends NativeModule<{
	onUpdate: (download: NativeDownload) => void;
}> {
	// directory for the app's videos
	movies: string;
	start(task: {
		id: string;
		url: string;
		file: string;
		headers: Record<string, string>;
		title: string;
		// notification text for each status
		texts: Record<
			"pending" | "preparing" | "queued" | "downloading" | "pause",
			string
		>;
	}): void;
	pause(id: string): void;
	resume(id: string): void;
	remove(id: string, file?: string): Promise<void>;
	getAll(): NativeDownload[];
	getSettings(): DownloadSettings;
	setSettings(settings: DownloadSettings): void;
}
const native = requireOptionalNativeModule<KyooDownloads>("KyooDownloads");

const storage = createMMKV({ id: "kyoo-downloads" });
const progress = createMMKV({ id: "kyoo-downloads-progress" });

const readDownload = (id: string) => {
	const raw = storage.getBuffer(id);
	return raw ? (decode(raw) as StoredDownload) : null;
};

const update = (id: string, patch: Partial<StoredDownload>) => {
	const download = readDownload(id);
	if (!download) return;
	storage.set(id, encode({ ...download, ...patch }).slice().buffer);
};

const sync = (x: NativeDownload) => {
	const download = readDownload(x.id);
	// deleted
	if (!download) return;
	const size = x.total && x.total > 0 ? x.total : download.size;
	const error = x.status === "failed" ? (x.error ?? null) : null;
	if (
		download.status !== x.status ||
		download.size !== size ||
		(download.error ?? null) !== error
	)
		update(x.id, { status: x.status, size, error });
	if (x.status === "preparing") progress.set(x.id, x.progress ?? 0);
	else if (
		x.status === "queued" ||
		x.status === "downloading" ||
		x.status === "paused"
	)
		progress.set(x.id, x.bytes ?? 0);
	else if (x.status !== "pending") {
		progress.remove(x.id);
		native!.remove(x.id, x.status === "failed" ? download.file : undefined);
	}
};

// opens the quality popup, it starts the download again with the selected quality
const AskQualityContext = createContext<
	(asking: { slug: string; info: VideoInfo }) => void
>(() => {});

export const useDownloadVideo = () => {
	const { t } = useTranslation();
	const alert = useAlert();
	const { apiUrl, authToken } = useToken();
	const account = useAccount();
	const [defaultQuality] = useSetting("defaultDownloadQuality", "ask");
	const askQuality = useContext(AskQualityContext);
	const { mutate: get } = useMutation((query: QueryIdentifier) => ({
		method: "GET",
		...query,
	}));

	const start = async (slug: string, requested?: Quality) => {
		const video = (await get(Player.query(slug))) as Video;
		const show =
			video.show && video.show.kind !== "collection"
				? ((await get(Header.query(video.show.kind, video.show.slug))) as Show)
				: null;
		const owner = account?.id ?? "guest";
		const existing = readDownload(video.id);
		const owners = { ...existing?.owners, [owner]: { video, show } };
		// already downloaded by another account
		if (existing && existing.status !== "failed")
			return update(video.id, { owners });

		const info = (await get(Info.infoQuery(slug))) as VideoInfo;
		const selected = requested ?? defaultQuality;
		if (selected === "ask") return askQuality({ slug, info });
		// android 13+ hides the download's notification without it
		await PermissionsAndroid.request(
			PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
		);

		const quality = availableQualities(info).includes(selected)
			? selected
			: "original";
		// slugs aren't unique between servers
		const file = new File(
			native!.movies,
			`${slug}-${video.id.slice(0, 8)}.mkv`,
		);
		const download: StoredDownload = {
			id: video.id,
			slug,
			apiUrl,
			status: "pending",
			quality,
			size: null,
			file: file.uri,
			createdAt: Date.now(),
			info,
			owners,
		};
		progress.remove(video.id);
		storage.set(video.id, encode(download).slice().buffer);
		const entry = video.entries?.[0];
		const title = [
			[video.show?.name, entry && entryDisplayNumber(entry)]
				.filter((x) => x)
				.join(" "),
			entry?.name,
		]
			.filter((x) => x)
			.join(" - ");
		const clientId = uuidv4();
		const headers: Record<string, string> = authToken
			? { Authorization: `Bearer ${authToken}` }
			: {};
		const task = {
			id: video.id,
			url: `${apiUrl}/video/${base64UrlPath(video.path)}/download/${quality}?id=${clientId}`,
			file: file.uri,
			headers,
			title: title || video.path,
			texts: {
				pending: t("downloads.status.pending"),
				preparing: t("downloads.status.preparing"),
				queued: t("downloads.status.queued"),
				downloading: t("downloads.status.downloading"),
				pause: t("downloads.pause"),
			},
		};
		try {
			native!.start(task);
		} catch (e) {
			update(video.id, {
				status: "failed",
				error: e instanceof Error ? e.message : String(e),
			});
			throw e;
		}
	};
	return (slug: string, quality?: Quality) =>
		start(slug, quality).catch((e) =>
			alert({
				title: t("downloads.status.failed"),
				message: e?.message ?? String(e),
				align: "left",
			}),
		);
};

export const deleteDownload = (
	download: Pick<Download, "id" | "file" | "owner">,
) => {
	const { [download.owner]: _, ...owners } =
		readDownload(download.id)?.owners ?? {};
	// still used by another account
	if (Object.keys(owners).length) return update(download.id, { owners });
	// removed first so the download's last updates are ignored
	storage.remove(download.id);
	progress.remove(download.id);
	native!.remove(download.id, download.file);
};

export const pauseDownload = (download: Download) => native!.pause(download.id);

export const resumeDownload = (download: Download) =>
	native!.resume(download.id);

export const useDownloadSettings = () => {
	const [settings, setSettings] = useState(() => native!.getSettings());
	return [
		settings,
		(patch: Partial<DownloadSettings>) => {
			const value = { ...settings, ...patch };
			native!.setSettings(value);
			setSettings(value);
		},
	] as const;
};

export const useDownloadPercent = (download: Download | undefined) => {
	const [value] = useMMKVNumber(download?.id ?? "", progress);
	if (!download) return 0;
	if (download.status === "pending") return 0;
	if (download.status === "preparing") return Math.floor(value ?? 0);
	return download.size ? Math.floor(((value ?? 0) / download.size) * 100) : 0;
};

const DownloadsContext = createContext<Download[]>([]);

export const useDownloads = () => useContext(DownloadsContext);

export const useDownload = (idOrSlug: string) =>
	useDownloads().find((x) => x.id === idOrSlug || x.slug === idOrSlug);

// the store can lose them (account switch, gc...), downloads still need to
// be playable offline. remounted after each reset of the store.
const Prefill = ({ downloads }: { downloads: Download[] }) => {
	const prefill = usePrefill();
	const run = useEffectEvent(() => {
		for (const x of downloads) {
			prefill(Player.query(x.slug), x.video);
			prefill(Info.infoQuery(x.slug), x.info);
			if (x.show) prefill(Header.query(x.show.kind, x.show.slug), x.show);
		}
	});
	useEffect(() => run(), []);
	return null;
};

export const DownloadsProvider = ({ children }: { children: ReactNode }) => {
	const { apiUrl } = useToken();
	const owner = useAccount()?.id ?? "guest";
	const { lastReset } = useContext(StateContext);
	const [all, setAll] = useState(() =>
		storage.getAllKeys().map((id) => readDownload(id)!),
	);
	useMMKVListener((id) => {
		const download = readDownload(id);
		setAll((all) => [
			...all.filter((x) => x.id !== id),
			...(download ? [download] : []),
		]);
	}, storage);
	const downloads = all.flatMap(({ owners, ...x }) =>
		x.apiUrl === apiUrl && owners[owner]
			? [{ ...x, ...owners[owner], owner }]
			: [],
	);
	const [asking, setAsking] = useState<{
		slug: string;
		info: VideoInfo;
	} | null>(null);
	const downloadVideo = useDownloadVideo();

	useEffect(() => {
		if (!canDownload) return;
		const sub = native!.addListener("onUpdate", sync);
		for (const x of native!.getAll()) sync(x);
		return () => sub.remove();
	}, []);

	return (
		<AskQualityContext.Provider value={setAsking}>
			<DownloadsContext.Provider value={downloads}>
				<Prefill
					key={`${apiUrl}-${owner}-${lastReset}`}
					downloads={downloads}
				/>
				{children}
				{asking && (
					<QualityPopup
						info={asking.info}
						onSelect={(quality) => downloadVideo(asking.slug, quality)}
						close={() => setAsking(null)}
					/>
				)}
			</DownloadsContext.Provider>
		</AskQualityContext.Provider>
	);
};
