import Refresh from "@material-symbols/svg-400/rounded/autorenew.svg";
// import Download from "@material-symbols/svg-400/rounded/download.svg";
import Info from "@material-symbols/svg-400/rounded/info.svg";
import MoreVert from "@material-symbols/svg-400/rounded/more_vert.svg";
import MovieInfo from "@material-symbols/svg-400/rounded/movie_info.svg";
import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { Platform } from "react-native";
import { useYoshiki } from "yoshiki/native";
import { WatchStatusV } from "~/models";
import { HR, IconButton, Menu, tooltip } from "~/primitives";
import { useAccount } from "~/providers/account-context";
import { useMutation } from "~/query";
import { watchListIcon } from "./watchlist-info";
// import { useDownloader } from "../../packages/ui/src/downloads/ui/src/downloads";

export const EntryContext = ({
	slug,
	serieSlug,
	...props
}: {
	serieSlug: string | null;
	slug: string;
} & Partial<ComponentProps<typeof Menu<typeof IconButton>>>) => {
	// const downloader = useDownloader();
	const { css } = useYoshiki();
	const { t } = useTranslation();

	return (
		<Menu
			Trigger={IconButton}
			icon={MoreVert}
			{...tooltip(t("misc.more"))}
			{...(css([Platform.OS !== "web" && { display: "none" }], props) as any)}
		>
			{serieSlug && (
				<Menu.Item
					label={t("home.episodeMore.goToShow")}
					icon={Info}
					href={`/series/${serieSlug}`}
				/>
			)}
			{/* <Menu.Item */}
			{/* 	label={t("home.episodeMore.download")} */}
			{/* 	icon={Download} */}
			{/* 	onSelect={() => downloader(type, slug)} */}
			{/* /> */}
			<Menu.Item
				label={t("home.episodeMore.mediainfo")}
				icon={MovieInfo}
				href={`/info/${slug}`}
			/>
		</Menu>
	);
};

export const ItemContext = ({
	kind,
	slug,
	status,
	...props
}: {
	kind: "movie" | "serie";
	slug: string;
	status: WatchStatusV | null;
} & Partial<ComponentProps<typeof Menu<typeof IconButton>>>) => {
	const account = useAccount();
	// const downloader = useDownloader();
	const { css } = useYoshiki();
	const { t } = useTranslation();

	const mutation = useMutation({
		path: [kind, slug, "watchStatus"],
		compute: (newStatus: WatchStatusV | null) => ({
			method: newStatus ? "POST" : "DELETE",
			params: newStatus ? { status: newStatus } : undefined,
		}),
		invalidate: [kind, slug],
	});

	const metadataRefreshMutation = useMutation({
		method: "POST",
		path: [kind, slug, "refresh"],
		invalidate: null,
	});

	return (
		<Menu
			Trigger={IconButton}
			icon={MoreVert}
			{...tooltip(t("misc.more"))}
			{...(css([Platform.OS !== "web" && { display: "none" }], props) as any)}
		>
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
			{kind === "movie" && (
				<>
					{/* <Menu.Item */}
					{/* 	label={t("home.episodeMore.download")} */}
					{/* 	icon={Download} */}
					{/* 	onSelect={() => downloader(type, slug)} */}
					{/* /> */}
					<Menu.Item
						label={t("home.episodeMore.mediainfo")}
						icon={MovieInfo}
						href={`/info/${slug}`}
					/>
				</>
			)}
			{account?.isAdmin === true && (
				<>
					<HR />
					<Menu.Item
						label={t("home.refreshMetadata")}
						icon={Refresh}
						onSelect={() => metadataRefreshMutation.mutate()}
					/>
				</>
			)}
		</Menu>
	);
};
