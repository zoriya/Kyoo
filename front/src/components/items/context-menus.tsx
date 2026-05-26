import Refresh from "@material-symbols/svg-400/rounded/autorenew.svg";
import Delete from "@material-symbols/svg-400/rounded/delete.svg";
import Download from "@material-symbols/svg-400/rounded/download.svg";
import Info from "@material-symbols/svg-400/rounded/info.svg";
import MoreVert from "@material-symbols/svg-400/rounded/more_vert.svg";
import MovieInfo from "@material-symbols/svg-400/rounded/movie_info.svg";
import Search from "@material-symbols/svg-400/rounded/search-fill.svg";
import VideoLibrary from "@material-symbols/svg-400/rounded/video_library-fill.svg";
import { useRouter } from "expo-router";
import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";
import { WatchStatusV } from "~/models";
import { HRP, IconButton, Menu, tooltip } from "~/primitives";
import { useAccount } from "~/providers/account-context";
import { useMutation } from "~/query";
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

	const markAsSeenMutation = useMutation({
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
		invalidate: null,
	});

	return (
		<Menu
			Trigger={IconButton}
			icon={MoreVert}
			className={cn("not:web:hidden", className)}
			{...tooltip(t("misc.more"))}
			{...(props as any)}
		>
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
		</Menu>
	);
};

export const ShowContext = ({
	kind,
	slug,
	name,
	videoSlug,
	status,
	showWatchlist = true,
	className,
	...props
}: {
	kind: "movie" | "serie" | "collection";
	slug: string;
	name: string;
	videoSlug: string | null;
	status: WatchStatusV | null;
	showWatchlist?: boolean;
	className?: string;
} & Partial<ComponentProps<typeof Menu>> &
	Partial<ComponentProps<typeof IconButton>>) => {
	const account = useAccount();
	const router = useRouter();
	const { t } = useTranslation();

	const mutation = useMutation({
		path: ["api", `${kind}s`, slug, "watchstatus"],
		compute: (newStatus: WatchStatusV | null) => ({
			method: newStatus ? "POST" : "DELETE",
			body: newStatus ? { status: newStatus } : undefined,
		}),
		invalidate: [kind, slug],
	});

	const metadataRefreshMutation = useMutation({
		method: "POST",
		path: ["scanner", `${kind}s`, slug, "refresh"],
		invalidate: null,
	});

	const deleteMutation = useMutation({
		method: "DELETE",
		path: ["api", `${kind}s`, slug],
		invalidate: ["api", "shows"],
	});

	return (
		<Menu
			Trigger={IconButton}
			icon={MoreVert}
			className={cn("not:web:hidden", className)}
			{...tooltip(t("misc.more"))}
			{...(props as any)}
		>
			{showWatchlist && kind !== "collection" && (
				<Menu.Sub
					label={account ? t("show.watchlistEdit") : t("show.watchlistLogin")}
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
											await deleteMutation.mutateAsync();
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
		</Menu>
	);
};
