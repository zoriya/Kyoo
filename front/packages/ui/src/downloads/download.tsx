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

import {
	download,
	completeHandler,
	directories,
	DownloadTask,
	checkForExistingDownloads,
	Network,
	ensureDownloadsAreRunning,
} from "@kesha-antonov/react-native-background-downloader";
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
import { atom, useSetAtom, useAtom, Atom, PrimitiveAtom, useStore } from "jotai";
import { getCurrentAccount, storage } from "@kyoo/models/src/account-internal";
import { useContext, useEffect } from "react";

type State = {
	status: "DOWNLOADING" | "PAUSED" | "DONE" | "FAILED" | "STOPPED";
	progress: number;
	size: number;
	availableSize: number;
	error?: string;
	pause: () => void;
	resume: () => void;
	stop: () => void;
	play: () => void;
};

const downloadAtom = atom<
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

const listenToTask = (
	task: DownloadTask,
	atom: PrimitiveAtom<State>,
	atomStore: ReturnType<typeof useStore>,
) => {
	task
		.begin(({ expectedBytes }) => atomStore.set(atom, (x) => ({ ...x, size: expectedBytes })))
		.progress((percent, availableSize, size) =>
			atomStore.set(atom, (x) => ({ ...x, percent, size, availableSize })),
		)
		.done(() => {
			atomStore.set(atom, (x) => ({ ...x, percent: 100, status: "DONE" }));
			// apparently this is needed for ios /shrug i'm totaly gona forget this
			// if i ever implement ios so keeping this here
			completeHandler(task.id);
		})
		.error((error) => atomStore.set(atom, (x) => ({ ...x, status: "FAILED", error })));
};

export const useDownloader = () => {
	const setDownloads = useSetAtom(downloadAtom);
	const atomStore = useStore();

	return async (type: "episode" | "movie", slug: string) => {
		const account = getCurrentAccount()!;
		const [data, info] = await Promise.all([
			query(Player.query(type, slug), account),
			query(Player.infoQuery(type, slug), account),
		]);

		// TODO: support custom paths
		const path = `${directories.documents}/${slug}-${data.id}.${info.extension}`;
		const task = download({
			id: data.id,
			// TODO: support variant qualities
			url: `${account.apiUrl}/api/video/${type}/${slug}/direct`,
			destination: path,
			headers: {
				Authorization: account.token.access_token,
			},
			// TODO: Implement only wifi
			// network: Network.ALL,
		});

		const state = atom({
			status: task.state,
			progress: task.percent * 100,
			size: task.totalBytes,
			availableSize: task.bytesWritten,
			pause: () => task.pause(),
			resume: () => task.resume(),
			stop: () => {
				task.stop();
				setDownloads((x) => x.filter((y) => y.data.id !== task.id));
			},
			play: () => {
				// TODO: set useQuery cache
				// TODO: move to the play page.
			},
		});

		// we use the store instead of the onMount because we want to update the state to cache it even if it was not
		// used during this launch of the app.
		listenToTask(task, state, atomStore);
		setDownloads((x) => [...x, { data, info, path, state }]);
	};
};

export const DownloadProvider = () => {
	const store = useStore();

	useEffect(() => {
		async function run() {
			const tasks = await checkForExistingDownloads();
			const downloads = store.get(downloadAtom);
			for (const t of tasks) {
				const downAtom = downloads.find((x) => x.data.id === t.id);
				if (!downAtom) {
					t.stop();
					continue;
				}
				listenToTask(t, downAtom.state, store);
			}
			ensureDownloadsAreRunning();
		}
		run();
	}, [store]);
};
