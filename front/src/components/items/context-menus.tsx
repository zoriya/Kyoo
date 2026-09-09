import Refresh from "@material-symbols/svg-400/rounded/autorenew.svg";
import Delete from "@material-symbols/svg-400/rounded/delete.svg";
import Download from "@material-symbols/svg-400/rounded/download.svg";
import Info from "@material-symbols/svg-400/rounded/info.svg";
import MoreHoriz from "@material-symbols/svg-400/rounded/more_horiz.svg";
import MoreVert from "@material-symbols/svg-400/rounded/more_vert.svg";
import MovieInfo from "@material-symbols/svg-400/rounded/movie_info.svg";
import Search from "@material-symbols/svg-400/rounded/search-fill.svg";
import VideoLibrary from "@material-symbols/svg-400/rounded/video_library-fill.svg";
import { eq, or, useDbClient, useLiveQuery } from "@tanstack/react-db";
import { useRouter } from "expo-router";
import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { WatchStatusV } from "~/models";
import { Alert, HRP, IconButton, Menu, tooltip } from "~/primitives";
import { entries, shows, watchStatusOf } from "~/db";
import { useAccount, useToken } from "~/providers/account-context";
import { keyToUrl, queryFn, toQueryKey, useMutation } from "~/query";
import { cn } from "~/utils";
import { watchListIcon } from "./watchlist-info";

export const EntryContext = ({
	kind,
	slug,
	serieSlug,
	videoSlug,
	className,
	...props
}: {
	kind: "movie" | "episode" | "special";
	serieSlug: string | null;
	slug: string;
	videoSlug: string | null;
	className?: string;
} & Partial<ComponentProps<typeof Menu>> &
	Partial<ComponentProps<typeof IconButton>>) => {
	const account = useAccount();
	const { t } = useTranslation();

	const client = useDbClient();
	const { apiUrl, authToken } = useToken();
	const { data: row } = useLiveQuery((q) =>
		q
			.from({ e: entries })
			.where(({ e }) => eq(e.slug, slug))
			.findOne(),
	);
	const markAsSeen = async () => {
		if (row) {
			client.collection(entries).update(row.id, (d) => {
				d.progress = { ...d.progress, percent: 100, playedDate: new Date() };
			});
			return;
		}
		// Not in the local db (player...): plain api call, the ws event syncs the rest.
		await queryFn({
			method: "POST",
			url: keyToUrl(
				toQueryKey({ apiUrl, path: ["api", "profiles", "me", "history"] }),
			),
			body: [
				{
					percent: 100,
					entry: slug,
					videoId: null,
					time: 0,
					playedDate: null,
					external: true,
				},
			],
			authToken,
			parser: null,
		});
	};

	return (
		<Menu
			Trigger={IconButton}
			icon={MoreVert}
			className={cn("not:web:hidden", className)}
			{...tooltip(t("misc.more"))}
			{...(props as any)}
		>
			{() => (
				<>
					{serieSlug && (
						<Menu.Item
							label={t("home.episodeMore.goToShow")}
							icon={Info}
							href={`/${kind === "movie" ? "movies" : "series"}/${serieSlug}`}
						/>
					)}
					{account && (
						<Menu.Item
							label={t("show.watchlistMark.completed")}
							icon={watchListIcon("completed")}
							onSelect={() => markAsSeen()}
						/>
					)}
					{videoSlug && (
						<>
							<Menu.Item
								label={t("home.episodeMore.download")}
								icon={Download}
								href={`/api/videos/${videoSlug}/direct`}
								download
							/>
							<Menu.Item
								label={t("home.episodeMore.mediainfo")}
								icon={MovieInfo}
								href={`/info/${videoSlug}`}
							/>
						</>
					)}
				</>
			)}
		</Menu>
	);
};

export const ShowContext = ({
	kind,
	slug,
	name,
	videoSlug,
	status: fallbackStatus,
	showWatchlist = true,
	className,
	horizontal = false,
	...props
}: {
	kind: "movie" | "serie" | "collection";
	slug: string;
	name: string;
	videoSlug: string | null;
	status: WatchStatusV | null;
	showWatchlist?: boolean;
	className?: string;
	horizontal?: boolean;
} & Partial<ComponentProps<typeof Menu>> &
	Partial<ComponentProps<typeof IconButton>>) => {
	const account = useAccount();
	const router = useRouter();
	const { t } = useTranslation();

	const client = useDbClient();
	const { data: row } = useLiveQuery((q) =>
		q
			.from({ s: shows })
			.where(({ s }) => or(eq(s.slug, slug), eq(s.id, slug)))
			.findOne(),
	);
	const status =
		row && row.kind !== "collection"
			? (row.watchStatus?.status ?? null)
			: fallbackStatus;
	const setStatus = (status: WatchStatusV | null) => {
		if (!row) return;
		client.collection(shows).update(row.id, (d) => {
			if (d.kind !== "collection") d.watchStatus = watchStatusOf(d, status);
		});
	};

	const metadataRefreshMutation = useMutation({
		method: "POST",
		path: ["scanner", `${kind}s`, slug, "refresh"],
		invalidate: null,
	});

	return (
		<Menu
			Trigger={IconButton}
			icon={horizontal ? MoreHoriz : MoreVert}
			className={cn("not:web:hidden", className)}
			{...tooltip(t("misc.more"))}
			{...(props as any)}
		>
			{() => (
				<>
					{showWatchlist && kind !== "collection" && (
						<Menu.Sub
							label={
								account ? t("show.watchlistEdit") : t("show.watchlistLogin")
							}
							disabled={!account}
							icon={watchListIcon(status)}
						>
							{Object.values(WatchStatusV).map((x) => (
								<Menu.Item
									key={x}
									label={t(
										`show.watchlistMark.${x.toLowerCase() as Lowercase<WatchStatusV>}`,
									)}
									onSelect={() => setStatus(x)}
									selected={x === status}
								/>
							))}
							{status !== null && (
								<Menu.Item
									label={t("show.watchlistMark.null")}
									onSelect={() => setStatus(null)}
								/>
							)}
						</Menu.Sub>
					)}
					{videoSlug && (
						<>
							<Menu.Item
								label={t("home.episodeMore.download")}
								icon={Download}
								href={`/api/videos/${videoSlug}/direct`}
								download
							/>
							<Menu.Item
								label={t("home.episodeMore.mediainfo")}
								icon={MovieInfo}
								href={`/info/${videoSlug}`}
							/>
						</>
					)}
					{account?.isAdmin === true && (
						<>
							<HRP text={t("navbar.admin")} />
							<Menu.Item
								label={t("show.videos-map")}
								icon={VideoLibrary}
								href={`/${kind === "movie" ? "movies" : "series"}/${slug}/videos`}
							/>
							{kind !== "collection" && (
								<Menu.Item
									label={t("show.remap")}
									icon={Search}
									href={`/${kind}s/${slug}/remap?q=${name}`}
								/>
							)}
							{kind !== "collection" && (
								<Menu.Item
									label={t("home.refreshMetadata")}
									icon={Refresh}
									onSelect={() => metadataRefreshMutation.mutate()}
								/>
							)}
							<Menu.Item
								label={t("misc.delete")}
								icon={Delete}
								onSelect={() => {
									Alert.alert(
										t("misc.delete-name", { name }),
										t("login.delete-confirmation"),
										[
											{ text: t("misc.cancel"), style: "cancel" },
											{
												text: t("misc.delete"),
												style: "destructive",
												onPress: async () => {
													if (row)
														await client.collection(shows).delete(row.id)
															.isPersisted.promise;
													router.back();
												},
											},
										],
										{ cancelable: true },
									);
								}}
							/>
						</>
					)}
				</>
			)}
		</Menu>
	);
};
