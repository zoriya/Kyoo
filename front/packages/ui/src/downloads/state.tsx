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
	type Account,
	type Episode,
	EpisodeP,
	type Movie,
	MovieP,
	type QueryIdentifier,
	type WatchInfo,
	WatchInfoP,
	queryFn,
	toQueryKey,
} from "@kyoo/models";
import { Player } from "../player";
import { atom, useSetAtom, type PrimitiveAtom, useStore } from "jotai";
import { getCurrentAccount, storage } from "@kyoo/models/src/account-internal";
import { type ReactNode, useEffect } from "react";
import { ToastAndroid } from "react-native";
import { type QueryClient, useQueryClient } from "@tanstack/react-query";
import type { Router } from "expo-router/build/types";
import { z } from "zod";

export type State = {
	status: "DOWNLOADING" | "PAUSED" | "DONE" | "FAILED" | "STOPPED";
	progress: number | null;
	size: number;
	availableSize: number;
	error?: string;
	pause: (() => void) | null;
	resume: (() => void) | null;
	remove: () => void;
	play: (router: Router) => void;
	retry: (() => void) | null;
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
	queryClient: QueryClient,
	stateAtom?: PrimitiveAtom<State>,
) => {
	if (!stateAtom) stateAtom = atom({} as State);
	store.set(stateAtom, {
		status: task.state,
		progress: task.bytesTotal ? (task.bytesDownloaded / task.bytesTotal) * 100 : null,
		size: task.bytesTotal,
		availableSize: task.bytesDownloaded,
		pause: () => {
			task.pause();
			store.set(stateAtom!, (x) => ({ ...x, state: "PAUSED" }));
		},
		resume: () => {
			task.resume();
			store.set(stateAtom!, (x) => ({ ...x, state: "DOWNLOADING" }));
		},
		remove: () => {
			task.stop();
			store.set(downloadAtom, (x) => x.filter((y) => y.data.id !== task.id));
		},
		play: () => {
			ToastAndroid.show("The file has not finished downloading", ToastAndroid.LONG);
		},
		retry: () => {
			const [newTask, path] = download(
				{
					type: state.data.kind,
					id: state.data.id,
					slug: state.data.slug,
					extension: state.info.extension,
				},
				getCurrentAccount()!,
			);
			setupDownloadTask({ ...state, path }, newTask, store, queryClient, stateAtom);
		},
	});

	// we use the store instead of the onMount because we want to update the state to cache it even if it was not
	// used during this launch of the app.
	const update = updater(store, stateAtom);

	task
		.begin(({ expectedBytes }) => update((x) => ({ ...x, size: expectedBytes })))
		.progress(({ bytesDownloaded, bytesTotal }) => {
			update((x) => ({
				...x,
				progress: Math.round((bytesDownloaded / bytesTotal) * 100),
				size: bytesTotal,
				availableSize: bytesDownloaded,
				status: "DOWNLOADING",
			}));
		})
		.done(() => {
			update((x) => ({ ...x, progress: 100, status: "DONE", play: playFn(state, queryClient) }));
			RNBackgroundDownloader.completeHandler(task.id);
		})
		.error(({ error }) => {
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

const download = (
	{
		type,
		id,
		slug,
		extension,
	}: { slug: string; id: string; type: "episode" | "movie"; extension: string },
	account: Account,
) => {
	// TODO: support custom paths
	const path = `${RNBackgroundDownloader.directories.documents}/${slug}-${id}.${extension}`;
	const task = RNBackgroundDownloader.download({
		id: id,
		// TODO: support variant qualities
		url: `${account.apiUrl}/${type}/${slug}/direct`,
		destination: path,
		headers: {
			Authorization: account.token.access_token,
		},
		showNotification: true,
		// TODO: Implement only wifi
		// network: Network.ALL,
	});
	console.log("Starting download", path);
	return [task, path] as const;
};

export const useDownloader = () => {
	const setDownloads = useSetAtom(downloadAtom);
	const store = useStore();
	const queryClient = useQueryClient();

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

			const [task, path] = download(
				{ type, slug, id: data.id, extension: info.extension },
				account,
			);
			setDownloads((x) => [
				...x,
				setupDownloadTask({ data, info, path }, task, store, queryClient),
			]);
		} catch (e) {
			console.error("download error", e);
			ToastAndroid.show(`Error downloading ${slug}`, ToastAndroid.LONG);
		}
	};
};

const playFn =
	(dl: { data: Episode | Movie; info: WatchInfo; path: string }, queryClient: QueryClient) =>
	(router: Router) => {
		dl.data.links.direct = dl.path;
		dl.data.links.hls = null;
		queryClient.setQueryData(toQueryKey(Player.query(dl.data.kind, dl.data.slug)), dl.data);
		queryClient.setQueryData(toQueryKey(Player.infoQuery(dl.data.kind, dl.data.slug)), dl.info);
		router.push(
			dl.data.kind === "episode"
				? { pathname: "/watch/[slug]", params: { slug: dl.data.slug } }
				: { pathname: "/movie/[slug]/watch", params: { slug: dl.data.slug } },
		);
	};

export const DownloadProvider = ({ children }: { children: ReactNode }) => {
	const store = useStore();
	const queryClient = useQueryClient();

	useEffect(() => {
		async function run() {
			if (store.get(downloadAtom).length) return;

			const tasks = await RNBackgroundDownloader.checkForExistingDownloads();
			const dls: { data: Episode | Movie; info: WatchInfo; path: string; state: State }[] =
				JSON.parse(storage.getString("downloads") ?? "[]");
			const downloads = dls.map((dl) => {
				const t = tasks.find((x) => x.id === dl.data.id);
				if (t) return setupDownloadTask(dl, t, store, queryClient);

				const stateAtom = atom({
					status: dl.state.status === "DONE" ? "DONE" : "FAILED",
					progress: dl.state.progress,
					size: dl.state.size,
					availableSize: dl.state.availableSize,
					pause: null,
					resume: null,
					play: playFn(dl, queryClient),
					remove: () => {
						deleteAsync(dl.path);
						store.set(downloadAtom, (x) => x.filter((y) => y.data.id !== dl.data.id));
					},
					retry: () => {
						const [newTask, path] = download(
							{
								type: dl.data.kind,
								id: dl.data.id,
								slug: dl.data.slug,
								extension: dl.info.extension,
							},
							getCurrentAccount()!,
						);
						setupDownloadTask({ ...dl, path }, newTask, store, queryClient, stateAtom);
					},
				} as State);
				return {
					data: z.union([EpisodeP, MovieP]).parse(dl.data),
					info: WatchInfoP.parse(dl.info),
					path: dl.path,
					state: stateAtom,
				};
			});
			store.set(downloadAtom, downloads);

			for (const t of tasks) {
				if (!downloads.find((x) => x.data.id === t.id)) t.stop();
			}
			RNBackgroundDownloader.ensureDownloadsAreRunning();
		}
		run();
	}, [store, queryClient]);

	return children;
};
