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

import { IconButton, tooltip } from "@kyoo/primitives";
import { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import BookmarkAdd from "@material-symbols/svg-400/rounded/bookmark_add.svg";
import Bookmark from "@material-symbols/svg-400/rounded/bookmark-fill.svg";
import BookmarkAdded from "@material-symbols/svg-400/rounded/bookmark_added-fill.svg";
import BookmarkRemove from "@material-symbols/svg-400/rounded/bookmark_remove.svg";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { WatchStatusV, queryFn } from "@kyoo/models";

export const WatchListInfo = ({
	type,
	slug,
	status,
	...props
}: {
	type: "movie" | "show" | "episode";
	slug: string;
	status: WatchStatusV | null;
	color: ComponentProps<typeof IconButton>["color"];
}) => {
	const { t } = useTranslation();

	const queryClient = useQueryClient();
	const mutation = useMutation({
		mutationFn: (newStatus: WatchStatusV | null) =>
			queryFn({
				path: [type, slug, "watchStatus", newStatus && `?status=${newStatus}`],
				method: newStatus ? "POST" : "DELETE",
			}),
		onSettled: async () => await queryClient.invalidateQueries({ queryKey: [type, slug] }),
	});

	if (mutation.isPending) status = mutation.variables;
	switch (status) {
		case null:
			return (
				<IconButton
					icon={BookmarkAdd}
					onPress={() => mutation.mutate(WatchStatusV.Planned)}
					{...tooltip(t("show.watchlistAdd"))}
					{...props}
				/>
			);
		case WatchStatusV.Planned:
			return (
				<IconButton
					icon={Bookmark}
					// onPress={() => mutation.mutate(WatchStatusV.)}
					{...tooltip(t("show.watchlistEdit"))}
					{...props}
				/>
			);
		case WatchStatusV.Watching:
			return (
				<IconButton
					icon={Bookmark}
					// onPress={() => mutation.mutate(WatchStatusV.Planned)}
					{...tooltip(t("show.watchlistEdit"))}
					{...props}
				/>
			);
		case WatchStatusV.Completed:
			return (
				<IconButton
					icon={BookmarkAdded}
					onPress={() => mutation.mutate(null)}
					{...tooltip(t("show.watchlistRemove"))}
					{...props}
				/>
			);
		case WatchStatusV.Droped:
			return (
				<IconButton
					icon={BookmarkRemove}
					// onPress={() => mutation.mutate(WatchStatusV.Planned)}
					{...tooltip(t("show.watchlistEdit"))}
					{...props}
				/>
			);
	}
};
