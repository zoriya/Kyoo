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

import { type MutationParam, WatchStatusV, useAccount } from "@kyoo/models";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useCallback } from "react";
import { useAtomValue } from "jotai";
import { useAtomCallback } from "jotai/utils";
import { playAtom, progressAtom } from "./state";

export const WatchStatusObserver = ({
	type,
	slug,
	duration,
}: {
	type: "episode" | "movie";
	slug: string;
	duration: number;
}) => {
	const account = useAccount();
	const queryClient = useQueryClient();
	const { mutate: _mutate } = useMutation<unknown, Error, MutationParam>({
		mutationKey: [type, slug, "watchStatus"],
		onSettled: async () =>
			await queryClient.invalidateQueries({ queryKey: [type === "episode" ? "show" : type, slug] }),
	});
	const mutate = useCallback(
		(type: string, slug: string, seconds: number) =>
			_mutate({
				method: "POST",
				path: [type, slug, "watchStatus"],
				params: {
					status: WatchStatusV.Watching,
					watchedTime: Math.round(seconds),
					percent: Math.round((seconds / duration) * 100),
				},
			}),
		[_mutate, duration],
	);
	const readProgress = useAtomCallback(
		useCallback((get) => {
			const currCount = get(progressAtom);
			return currCount;
		}, []),
	);

	// update watch status every 10 seconds and on unmount.
	useEffect(() => {
		if (!account) return;
		const timer = setInterval(() => {
			mutate(type, slug, readProgress());
		}, 10_000);
		return () => {
			clearInterval(timer);
			mutate(type, slug, readProgress());
		};
	}, [account, type, slug, readProgress, mutate]);

	// update watch status when play status change (and on mount).
	const isPlaying = useAtomValue(playAtom);
	// biome-ignore lint/correctness/useExhaustiveDependencies: Include isPlaying
	useEffect(() => {
		if (!account) return;
		mutate(type, slug, readProgress());
	}, [account, type, slug, isPlaying, readProgress, mutate]);
	return null;
};
