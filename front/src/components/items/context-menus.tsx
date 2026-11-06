import { Invalidate } from "@data-client/rest";
import Refresh from "@material-symbols/svg-400/rounded/autorenew.svg";
import Delete from "@material-symbols/svg-400/rounded/delete.svg";
import Download from "@material-symbols/svg-400/rounded/download.svg";
import Info from "@material-symbols/svg-400/rounded/info.svg";
import MoreHoriz from "@material-symbols/svg-400/rounded/more_horiz.svg";
import MoreVert from "@material-symbols/svg-400/rounded/more_vert.svg";
import MovieInfo from "@material-symbols/svg-400/rounded/movie_info.svg";
import Search from "@material-symbols/svg-400/rounded/search-fill.svg";
import VideoLibrary from "@material-symbols/svg-400/rounded/video_library-fill.svg";
import { useRouter } from "expo-router";
import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { Platform } from "react-native";
import { useMutation } from "~/data";
import { Entry, Show, WatchStatusV } from "~/models";
import { Alert, HRP, IconButton, Menu, tooltip } from "~/primitives";
import { useAccount } from "~/providers/account-context";
import { cn } from "~/utils";
import { useWatchStatus, watchListIcon } from "./watchlist-info";

export const EntryContext = ({
	id,
	kind,
	slug,
	serieSlug,
	videoSlug,
	className,
	...props
}: {
	id: string;
	kind: "movie" | "episode" | "special";
	serieSlug: string | null;
	slug: string;
	videoSlug: string | null;
	className?: string;
} & Partial<ComponentProps<typeof Menu>> &
	Partial<ComponentProps<typeof IconButton>>) => {
	const account = useAccount();
	const { t } = useTranslation();

	const markAsSeenMutation = useMutation(() => ({
		method: "POST",
		path: ["api", "profiles", "me", "history"],
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
		optimisticSchema: Entry,
		optimistic: () => ({
			id,
			kind,
			progress: {
				percent: 100,
				time: 0,
				playedDate: new Date().toISOString(),
				videoId: null,
			},
		}),
	}));

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
							onSelect={() => markAsSeenMutation.mutate()}
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
	id,
	kind,
	slug,
	name,
	videoSlug,
	status,
	showWatchlist = true,
	className,
	horizontal = false,
	...props
}: {
	id: string;
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

	const mutation = useWatchStatus({ id, kind, slug });

	const metadataRefreshMutation = useMutation(() => ({
		method: "POST",
		path: ["scanner", `${kind}s`, slug, "refresh"],
	}));

	const deleteMutation = useMutation(() => ({
		method: "DELETE",
		path: ["api", `${kind}s`, slug],
		optimisticSchema: new Invalidate(Show.schema[kind]),
		optimistic: () => ({ id }),
	}));

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
							{!Platform.isTV && (
								<Menu.Item
									label={t("show.videos-map")}
									icon={VideoLibrary}
									href={`/${kind === "movie" ? "movies" : "series"}/${slug}/videos`}
								/>
							)}
							{!Platform.isTV && kind !== "collection" && (
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
													await deleteMutation.mutate();
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
