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

import { WatchStatusV, queryFn, useAccount } from "@kyoo/models";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useCallback } from "react";
import { useAtomValue } from "jotai";
import { useAtomCallback } from "jotai/utils";
import { playAtom, progressAtom } from "./state";

export const WatchStatusObserver = ({
	type,
	slug,
}: {
	type: "episode" | "movie";
	slug: string;
}) => {
	const account = useAccount();
	const queryClient = useQueryClient();
	const { mutate } = useMutation({
		mutationFn: (seconds: number) =>
			queryFn({
				path: [
					type,
					slug,
					"watchStatus",
					`?status=${WatchStatusV.Watching}&watchedTime=${Math.round(seconds)}`,
				],
				method: "POST",
			}),
		onSettled: async () =>
			await queryClient.invalidateQueries({ queryKey: [type === "episode" ? "show" : type, slug] }),
	});
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
			mutate(readProgress());
		}, 10_000);
		return () => {
			clearInterval(timer);
			mutate(readProgress());
		};
	}, [account, type, slug, readProgress, mutate]);

	// update watch status when play status change (and on mount).
	const isPlaying = useAtomValue(playAtom);
	useEffect(() => {
		if (!account) return;
		mutate(readProgress());
	}, [account, type, slug, isPlaying, readProgress, mutate]);
	return null;
};
