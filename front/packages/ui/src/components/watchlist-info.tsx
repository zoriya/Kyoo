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

import { IconButton, Menu, tooltip } from "@kyoo/primitives";
import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import BookmarkAdd from "@material-symbols/svg-400/rounded/bookmark_add.svg";
import Bookmark from "@material-symbols/svg-400/rounded/bookmark-fill.svg";
import BookmarkAdded from "@material-symbols/svg-400/rounded/bookmark_added-fill.svg";
import BookmarkRemove from "@material-symbols/svg-400/rounded/bookmark_remove.svg";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { WatchStatusV, queryFn, useAccount } from "@kyoo/models";

export const watchListIcon = (status: WatchStatusV | null) => {
	switch (status) {
		case null:
			return BookmarkAdd;
		case WatchStatusV.Completed:
			return BookmarkAdded;
		case WatchStatusV.Droped:
			return BookmarkRemove;
		default:
			return Bookmark;
	}
};

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
	const account = useAccount();
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

	if (account == null) {
		return (
			<IconButton icon={BookmarkAdd} disabled {...tooltip(t("show.watchlistLogin"))} {...props} />
		);
	}

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
		case WatchStatusV.Completed:
			return (
				<IconButton
					icon={BookmarkAdded}
					onPress={() => mutation.mutate(null)}
					{...tooltip(t("show.watchlistRemove"))}
					{...props}
				/>
			);
		case WatchStatusV.Planned:
		case WatchStatusV.Watching:
		case WatchStatusV.Droped:
			return (
				<Menu
					Trigger={IconButton}
					icon={watchListIcon(status)}
					{...tooltip(t("show.watchlistEdit"))}
					{...props}
				>
					{Object.values(WatchStatusV).map((x) => (
						<Menu.Item
							key={x}
							label={t(`show.watchlistMark.${x.toLowerCase()}`)}
							onSelect={() => mutation.mutate(x)}
							selected={x === status}
						/>
					))}
					<Menu.Item label={t("show.watchlistMark.null")} onSelect={() => mutation.mutate(null)} />
				</Menu>
			);
	}
};
