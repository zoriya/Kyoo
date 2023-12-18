/*
 * Kyoo - A portable and vast media library solution.
 * Copyright (c) Kyoo.
 *
 * See AUTHORS.md and LICENSE file in the project root for full license information.
 *
 * Kyoo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * Kyoo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Kyoo. If not, see <https://www.gnu.org/licenses/>.
 */

import RNBackgroundDownloader, {
	type DownloadTask,
} from "@kesha-antonov/react-native-background-downloader";
import { deleteAsync } from "expo-file-system";
import {
	Account,
	Episode,
	Movie,
	QueryIdentifier,
	WatchInfo,
	queryFn,
	toQueryKey,
} from "@kyoo/models";
import { Player } from "../player";
import { atom, useSetAtom, PrimitiveAtom, useStore } from "jotai";
import { getCurrentAccount, storage } from "@kyoo/models/src/account-internal";
import { ReactNode, useEffect } from "react";
import { Platform, ToastAndroid } from "react-native";

export type State = {
	status: "DOWNLOADING" | "PAUSED" | "DONE" | "FAILED" | "STOPPED";
	progress: number;
	size: number;
	availableSize: number;
	error?: string;
	pause: (() => void) | null;
	resume: (() => void) | null;
	remove: () => void;
	play: () => void;
};

export const downloadAtom = atom<
	{
		data: Episode | Movie;
		info: WatchInfo;
		path: string;
		state: PrimitiveAtom<State>;
	}[]
>([]);

const query = <T,>(query: QueryIdentifier<T>, info: Account): Promise<T> =>
	queryFn(
		{
			queryKey: toQueryKey(query),
			signal: undefined as any,
			meta: undefined,
			apiUrl: info.apiUrl,
			// use current user and current apiUrl to download this meta.
		},
		query.parser,
		info.token.access_token,
	);

const setupDownloadTask = (
	state: { data: Episode | Movie; info: WatchInfo; path: string },
	task: DownloadTask,
	store: ReturnType<typeof useStore>,
) => {
	const stateAtom = atom({
		status: task.state,
		progress: task.percent * 100,
		size: task.totalBytes,
		availableSize: task.bytesWritten,
		pause: () => {
			task.pause();
			store.set(stateAtom, (x) => ({ ...x, state: "PAUSED" }));
		},
		resume: () => {
			task.resume();
			store.set(stateAtom, (x) => ({ ...x, state: "DOWNLOADING" }));
		},
		remove: () => {
			task.stop();
			store.set(downloadAtom, (x) => x.filter((y) => y.data.id !== task.id));
		},
		play: () => {
			// TODO: set useQuery cache
			// TODO: move to the play page.
		},
	} as State);

	// we use the store instead of the onMount because we want to update the state to cache it even if it was not
	// used during this launch of the app.
	const update = updater(store, stateAtom);

	task
		.begin(({ expectedBytes }) => update((x) => ({ ...x, size: expectedBytes })))
		.progress((percent, availableSize, size) =>
			update((x) => ({ ...x, percent, size, availableSize, status: "DOWNLOADING" })),
		)
		.done(() => {
			update((x) => ({ ...x, percent: 100, status: "DONE" }));
			// apparently this is needed for ios /shrug i'm totaly gona forget this
			// if i ever implement ios so keeping this here
			if (Platform.OS === "ios") RNBackgroundDownloader.completeHandler(task.id);
		})
		.error((error) => {
			update((x) => ({ ...x, status: "FAILED", error }));
			console.error(`Error downloading ${state.data.slug}`, error);
			ToastAndroid.show(`Error downloading ${state.data.slug}`, ToastAndroid.LONG);
		});

	return { data: state.data, info: state.info, path: state.path, state: stateAtom };
};

const updater = (
	store: ReturnType<typeof useStore>,
	atom: PrimitiveAtom<State>,
): ((f: (old: State) => State) => void) => {
	return (f) => {
		// if it lags, we could only store progress info on status change and not on every change.
		store.set(atom, f);

		const downloads = store.get(downloadAtom);
		storage.set(
			"downloads",
			JSON.stringify(
				downloads.map((d) => ({
					data: d.data,
					info: d.info,
					path: d.path,
					state: store.get(d.state),
				})),
			),
		);
	};
};

export const useDownloader = () => {
	const setDownloads = useSetAtom(downloadAtom);
	const store = useStore();

	return async (type: "episode" | "movie", slug: string) => {
		try {
			const account = getCurrentAccount()!;
			const [data, info] = await Promise.all([
				query(Player.query(type, slug), account),
				query(Player.infoQuery(type, slug), account),
			]);

			if (store.get(downloadAtom).find((x) => x.data.id === data.id)) {
				ToastAndroid.show(`${slug} is already downloaded, skipping`, ToastAndroid.LONG);
				return;
			}

			// TODO: support custom paths
			const path = `${RNBackgroundDownloader.directories.documents}/${slug}-${data.id}.${info.extension}`;
			const task = RNBackgroundDownloader.download({
				id: data.id,
				// TODO: support variant qualities
				url: `${account.apiUrl}/video/${type}/${slug}/direct`,
				destination: path,
				headers: {
					Authorization: account.token.access_token,
				},
				// TODO: Implement only wifi
				// network: Network.ALL,
			});
			console.log("Starting download", path);

			setDownloads((x) => [...x, setupDownloadTask({ data, info, path }, task, store)]);
		} catch (e) {
			console.error("download error", e);
			ToastAndroid.show(`Error downloading ${slug}`, ToastAndroid.LONG);
		}
	};
};

export const DownloadProvider = ({ children }: { children: ReactNode }) => {
	const store = useStore();

	useEffect(() => {
		async function run() {
			if (store.get(downloadAtom).length) return;

			const tasks = await RNBackgroundDownloader.checkForExistingDownloads();
			const dls: { data: Episode | Movie; info: WatchInfo; path: string; state: State }[] =
				JSON.parse(storage.getString("downloads") ?? "[]");
			const downloads = dls.map((dl) => {
				const t = tasks.find((x) => x.id == dl.data.id);
				if (t) return setupDownloadTask(dl, t, store);
				return {
					data: dl.data,
					info: dl.info,
					path: dl.path,
					state: atom({
						status: dl.state.status === "DONE" ? "DONE" : "FAILED",
						progress: dl.state.progress,
						size: dl.state.size,
						availableSize: dl.state.availableSize,
						pause: null,
						resume: null,
						play: () => {
							// TODO: setup this
						},
						remove: () => {
							deleteAsync(dl.path);
							store.set(downloadAtom, (x) => x.filter((y) => y.data.id !== dl.data.id));
						},
					} as State),
				};
			});
			store.set(downloadAtom, downloads);

			for (const t of tasks) {
				if (!downloads.find((x) => x.data.id === t.id)) t.stop();
			}
			RNBackgroundDownloader.ensureDownloadsAreRunning();
		}
		run();
	}, [store]);

	return children;
};
