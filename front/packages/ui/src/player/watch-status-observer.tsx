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

import { WatchStatusV, queryFn } from "@kyoo/models";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAtomValue } from "jotai";
import { playAtom, progressAtom } from "./state";

export const WatchStatusObserver = ({
	type,
	slug,
}: {
	type: "episode" | "movie";
	slug: string;
}) => {
	const queryClient = useQueryClient();
	const mutation = useMutation({
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

	const isPlaying = useAtomValue(playAtom);
	const progress = useAtomValue(progressAtom);
	useEffect(() => {
		mutation.mutate(progress);
		// Do not make a request every seconds.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [type, slug, isPlaying]);
	return null;
};
