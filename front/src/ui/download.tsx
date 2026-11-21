import { StateContext } from "@data-client/react";
import {
	completeHandler,
	createDownloadTask,
	type DownloadTask,
	getExistingDownloadTasks,
	setConfig,
} from "@kesha-antonov/react-native-background-downloader";
import { decode, encode } from "@msgpack/msgpack";
import { requireOptionalNativeModule } from "expo";
import { File } from "expo-file-system";
import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useEffectEvent,
	useState,
} from "react";
import { PermissionsAndroid, Platform } from "react-native";
import { createMMKV, useMMKVListener, useMMKVNumber } from "react-native-mmkv";
import { type QueryIdentifier, useMutation, usePrefill } from "~/data";
import type { Show, Video, VideoInfo } from "~/models";
import { useAccount, useToken } from "~/providers/account-context";
import { Header } from "~/ui/details/header";
import { Info } from "~/ui/info";
import { base64UrlPath, Player } from "~/ui/player";

// browsers have their own downloads, tvs don't need them
export const canDownload = Platform.OS !== "web" && !Platform.isTV;

export type Download = {
	id: string;
	slug: string;
	apiUrl: string;
	account: string | null;
	status: "downloading" | "done" | "failed";
	file: string;
	createdAt: number;
	video: Video;
	info: VideoInfo;
	show: Show | null;
};

// android's directory for the app's videos (see modules/kyoo-paths)
const paths = requireOptionalNativeModule<{ movies: string }>("KyooPaths");

const storage = createMMKV({ id: "kyoo-downloads" });
const progress = createMMKV({ id: "kyoo-downloads-progress" });

const setStatus = (id: string, status: Download["status"]) => {
	progress.remove(id);
	const raw = storage.getBuffer(id);
	if (!raw) return;
	// `slice()` since `encode` returns a view over a bigger shared buffer
	const download = { ...(decode(raw) as Download), status };
	storage.set(id, encode(download).slice().buffer);
};

const track = (task: DownloadTask) =>
	task
		.progress(({ bytesDownloaded }) => progress.set(task.id, bytesDownloaded))
		.done(() => {
			completeHandler(task.id);
			setStatus(task.id, "done");
		})
		.error(() => {
			completeHandler(task.id);
			setStatus(task.id, "failed");
		});

export const useDownloadVideo = () => {
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

		const headers: Record<string, string> = authToken
			? { Authorization: `Bearer ${authToken}` }
			: {};
		const file = new File(paths!.movies, `${video.id}.${info.extension}`);
		const download: Download = {
			id: video.id,
			slug,
			apiUrl,
			account: account?.id ?? null,
			status: "downloading",
			file: file.uri,
			createdAt: Date.now(),
			video,
			info,
			show,
		};
		storage.set(video.id, encode(download).slice().buffer);
		const title = [video.show?.name, video.entries?.[0]?.name]
			.filter((x) => x)
			.join(" - ");
		const task = createDownloadTask({
			id: video.id,
			url: `${apiUrl}/video/${base64UrlPath(video.path)}/direct`,
			destination: file.uri,
			headers,
			notificationTitle: title || video.path,
		});
		track(task);
		task.start();
	};
};

export const deleteDownload = async (download: Download) => {
	const tasks = await getExistingDownloadTasks();
	await tasks.find((x) => x.id === download.id)?.stop();
	const file = new File(download.file);
	if (file.exists) file.delete();
	progress.remove(download.id);
	storage.remove(download.id);
};

export const useDownloadPercent = (download: Download | undefined) => {
	const [bytes] = useMMKVNumber(download?.id ?? "", progress);
	return download ? Math.floor(((bytes ?? 0) / download.info.bytes) * 100) : 0;
};

const DownloadsContext = createContext<Download[]>([]);

export const useDownloads = () => useContext(DownloadsContext);

export const useDownload = (idOrSlug: string) =>
	useDownloads().find((x) => x.id === idOrSlug || x.slug === idOrSlug);

// downloads keep running while the app is closed, reattach to them
const restore = async () => {
	setConfig({ showNotificationsEnabled: true });
	const tasks = await getExistingDownloadTasks();
	for (const id of storage.getAllKeys()) {
		const download = decode(storage.getBuffer(id)!) as Download;
		if (download.status !== "downloading") continue;
		const task = tasks.find((x) => x.id === id);
		if (task && task.state !== "DONE") {
			track(task);
			continue;
		}
		// finished while the app was closed. failed tasks are not returned
		completeHandler(id);
		const file = new File(download.file);
		setStatus(
			id,
			file.exists && file.size === download.info.bytes ? "done" : "failed",
		);
	}
};

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
		if (canDownload) restore();
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
