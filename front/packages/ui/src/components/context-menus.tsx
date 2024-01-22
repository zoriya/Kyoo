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
import { ComponentProps, ReactElement, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import MoreVert from "@material-symbols/svg-400/rounded/more_vert.svg";
import Info from "@material-symbols/svg-400/rounded/info.svg";
import MovieInfo from "@material-symbols/svg-400/rounded/movie_info.svg";
import Download from "@material-symbols/svg-400/rounded/download.svg";
import { WatchStatusV, queryFn, useAccount } from "@kyoo/models";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { watchListIcon } from "./watchlist-info";
import { useDownloader } from "../downloads";
import { Platform } from "react-native";
import { useYoshiki } from "yoshiki/native";
import { MediaInfoPopup } from "./media-info";

export const EpisodesContext = ({
	type = "episode",
	slug,
	showSlug,
	status,
	force,
	...props
}: {
	type?: "show" | "movie" | "episode";
	showSlug?: string | null;
	slug: string;
	status: WatchStatusV | null;
	force?: boolean;
} & Partial<ComponentProps<typeof Menu<typeof IconButton>>>) => {
	const account = useAccount();
	const downloader = useDownloader();
	const { css } = useYoshiki();
	const { t } = useTranslation();
	const [popup, setPopup] = useState<ReactElement | undefined>(undefined);

	const queryClient = useQueryClient();
	const mutation = useMutation({
		mutationFn: (newStatus: WatchStatusV | null) =>
			queryFn({
				path: [type, slug, "watchStatus", newStatus && `?status=${newStatus}`],
				method: newStatus ? "POST" : "DELETE",
			}),
		onSettled: async () => await queryClient.invalidateQueries({ queryKey: [type, slug] }),
	});

	return (
		<>
			<Menu
				Trigger={IconButton}
				icon={MoreVert}
				{...tooltip(t("misc.more"))}
				{...(css([Platform.OS !== "web" && !force && { display: "none" }], props) as any)}
			>
				{showSlug && (
					<Menu.Item
						label={t("home.episodeMore.goToShow")}
						icon={Info}
						href={`/show/${showSlug}`}
					/>
				)}
				<Menu.Sub
					label={account ? t("show.watchlistEdit") : t("show.watchlistLogin")}
					disabled={!account}
					icon={watchListIcon(status)}
				>
					{Object.values(WatchStatusV).map((x) => (
						<Menu.Item
							key={x}
							label={t(`show.watchlistMark.${x.toLowerCase()}`)}
							onSelect={() => mutation.mutate(x)}
							selected={x === status}
						/>
					))}
					{status !== null && (
						<Menu.Item
							label={t("show.watchlistMark.null")}
							onSelect={() => mutation.mutate(null)}
						/>
					)}
				</Menu.Sub>
				{type !== "show" && (
					<>
						<Menu.Item
							label={t("home.episodeMore.download")}
							icon={Download}
							onSelect={() => downloader(type, slug)}
						/>
						<Menu.Item
							label={t("home.episodeMore.mediainfo")}
							icon={MovieInfo}
							onSelect={() =>
								setPopup(
									<MediaInfoPopup
										mediaType={type}
										mediaSlug={slug}
										close={() => setPopup(undefined)}
									/>,
								)
							}
						/>
					</>
				)}
			</Menu>
			{popup}
		</>
	);
};

export const ItemContext = ({
	type,
	slug,
	status,
	force,
	...props
}: {
	type: "movie" | "show";
	slug: string;
	status: WatchStatusV | null;
	force?: boolean;
} & Partial<ComponentProps<typeof Menu<typeof IconButton>>>) => {
	return (
		<EpisodesContext
			type={type}
			slug={slug}
			status={status}
			showSlug={null}
			force={force}
			{...props}
		/>
	);
};
