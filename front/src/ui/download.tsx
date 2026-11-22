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
import { type QueryIdentifier, useMutation, usePrefill } from "~/data";
import type { Quality, Show, Video, VideoInfo } from "~/models";
import { useAccount, useToken } from "~/providers/account-context";
import { Header } from "~/ui/details/header";
import { Info } from "~/ui/info";
import { base64UrlPath, Player } from "~/ui/player";

// browsers have their own downloads, tvs don't need them.
// ios needs its own version of modules/kyoo-downloads
export const canDownload = Platform.OS === "android" && !Platform.isTV;

export type Download = {
	id: string;
	slug: string;
	apiUrl: string;
	account: string | null;
	status:
		| "pending"
		| "preparing"
		| "downloading"
		| "paused"
		| "done"
		| "failed";
	quality: Quality;
	size: number | null;
	file: string;
	createdAt: number;
	video: Video;
	info: VideoInfo;
	show: Show | null;
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
		texts: Record<"pending" | "preparing" | "downloading", string>;
	}): void;
	pause(id: string): void;
	resume(id: string): void;
	remove(id: string, file?: string): Promise<void>;
	getAll(): NativeDownload[];
}
const native = requireOptionalNativeModule<KyooDownloads>("KyooDownloads");

const storage = createMMKV({ id: "kyoo-downloads" });
const progress = createMMKV({ id: "kyoo-downloads-progress" });

const readDownload = (id: string) => {
	const raw = storage.getBuffer(id);
	return raw ? (decode(raw) as Download) : null;
};

const update = (id: string, patch: Partial<Download>) => {
	const download = readDownload(id);
	if (!download) return;
	storage.set(id, encode({ ...download, ...patch }).slice().buffer);
};

const sync = (x: NativeDownload) => {
	const download = readDownload(x.id);
	// deleted
	if (!download) return;
	const size = x.total && x.total > 0 ? x.total : download.size;
	if (download.status !== x.status || download.size !== size)
		update(x.id, { status: x.status, size });
	if (x.status === "preparing") progress.set(x.id, x.progress ?? 0);
	else if (x.status === "downloading" || x.status === "paused")
		progress.set(x.id, x.bytes ?? 0);
	else if (x.status !== "pending") {
		progress.remove(x.id);
		if (x.status === "failed") console.warn("download failed", x.error);
		native!.remove(x.id, x.status === "failed" ? download.file : undefined);
	}
};

export const useDownloadVideo = () => {
	const { t } = useTranslation();
	const { apiUrl, authToken } = useToken();
	const account = useAccount();
	const { mutate: get } = useMutation((query: QueryIdentifier) => ({
		method: "GET",
		...query,
	}));

	return async (slug: string) => {
		// android 13+ hides the download's notification without it
		await PermissionsAndroid.request(
			PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
		);
		const video = (await get(Player.query(slug))) as Video;
		const info = (await get(Info.infoQuery(slug))) as VideoInfo;
		const show =
			video.show && video.show.kind !== "collection"
				? ((await get(Header.query(video.show.kind, video.show.slug))) as Show)
				: null;

		const quality: Quality = "original";
		const file = new File(native!.movies, `${slug}.mkv`);
		const download: Download = {
			id: video.id,
			slug,
			apiUrl,
			account: account?.id ?? null,
			status: "pending",
			quality,
			size: null,
			file: file.uri,
			createdAt: Date.now(),
			video,
			info,
			show,
		};
		progress.remove(video.id);
		storage.set(video.id, encode(download).slice().buffer);
		const title = [video.show?.name, video.entries?.[0]?.name]
			.filter((x) => x)
			.join(" - ");
		const clientId = uuidv4();
		try {
			native!.start({
				id: video.id,
				url: `${apiUrl}/video/${base64UrlPath(video.path)}/download/${quality}?id=${clientId}`,
				file: file.uri,
				headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
				title: title || video.path,
				texts: {
					pending: t("downloads.status.pending"),
					preparing: t("downloads.status.preparing"),
					downloading: t("downloads.status.downloading"),
				},
			});
		} catch (e) {
			update(video.id, { status: "failed" });
			throw e;
		}
	};
};

export const deleteDownload = (download: Download) => {
	// removed first so the download's last updates are ignored
	storage.remove(download.id);
	progress.remove(download.id);
	native!.remove(download.id, download.file);
};

export const pauseDownload = (download: Download) => native!.pause(download.id);

export const resumeDownload = (download: Download) =>
	native!.resume(download.id);

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
	const account = useAccount()?.id ?? null;
	const { lastReset } = useContext(StateContext);
	const [all, setAll] = useState(() =>
		storage
			.getAllKeys()
			.map((id) => decode(storage.getBuffer(id)!) as Download),
	);
	useMMKVListener((id) => {
		const raw = storage.getBuffer(id);
		setAll((all) => [
			...all.filter((x) => x.id !== id),
			...(raw ? [decode(raw) as Download] : []),
		]);
	}, storage);
	const downloads = all.filter(
		(x) => x.apiUrl === apiUrl && x.account === account,
	);

	useEffect(() => {
		if (!canDownload) return;
		const sub = native!.addListener("onUpdate", sync);
		for (const x of native!.getAll()) sync(x);
		return () => sub.remove();
	}, []);

	return (
		<DownloadsContext.Provider value={downloads}>
			<Prefill
				key={`${apiUrl}-${account}-${lastReset}`}
				downloads={downloads}
			/>
			{children}
		</DownloadsContext.Provider>
	);
};
