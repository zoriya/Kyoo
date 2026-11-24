import DownloadIcon from "@material-symbols/svg-400/rounded/download.svg";
import DownloadDone from "@material-symbols/svg-400/rounded/download_done.svg";
import Downloading from "@material-symbols/svg-400/rounded/downloading.svg";
import ErrorIcon from "@material-symbols/svg-400/rounded/error.svg";
import HourglassTop from "@material-symbols/svg-400/rounded/hourglass_top.svg";
import PauseCircle from "@material-symbols/svg-400/rounded/pause_circle.svg";
import VideoSettings from "@material-symbols/svg-400/rounded/video_settings.svg";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import {
	Icon,
	Menu,
	PressableFeedback,
	SubP,
	tooltip,
	useAlert,
} from "~/primitives";
import { cn } from "~/utils";
import {
	canDownload,
	deleteDownload,
	pauseDownload,
	resumeDownload,
	useDownloadPercent,
	useDownloads,
	useDownloadVideo,
} from "./download";

const icons = {
	pending: HourglassTop,
	preparing: VideoSettings,
	queued: HourglassTop,
	downloading: Downloading,
	paused: PauseCircle,
	done: DownloadDone,
	failed: ErrorIcon,
};

export const useDownloadAction = (slugs: string[]) => {
	const { t } = useTranslation();
	const alert = useAlert();
	const download = useDownloads().find((x) => slugs.includes(x.slug));
	const downloadVideo = useDownloadVideo();

	const start = () => downloadVideo(slugs[0], download?.quality);
	const onPress = () => {
		if (!download) return start();
		alert({
			title: t(`downloads.status.${download.status}`),
			message: download.error ?? undefined,
			align: download.status === "failed" ? "left" : "center",
			buttons: [
				{ text: t("misc.close"), style: "cancel" },
				{
					text:
						download.status === "done" || download.status === "failed"
							? t("misc.delete")
							: t("downloads.cancel"),
					style: "destructive",
					onPress: () => deleteDownload(download),
				},
				...(download.status === "pending" ||
				download.status === "preparing" ||
				download.status === "queued" ||
				download.status === "downloading"
					? [
							{
								text: t("downloads.pause"),
								onPress: () => pauseDownload(download),
							},
						]
					: []),
				...(download.status === "paused"
					? [
							{
								text: t("downloads.resume"),
								onPress: () => resumeDownload(download),
							},
						]
					: []),
				...(download.status === "failed"
					? [{ text: t("downloads.retry"), onPress: start }]
					: []),
			],
		});
	};
	return {
		download,
		label: download
			? t(`downloads.status.${download.status}`)
			: t("home.episodeMore.download"),
		icon: download ? icons[download.status] : DownloadIcon,
		onPress,
	};
};

export const DownloadButton = ({
	videos,
	onSelectVideos,
	className,
	iconClassName,
}: {
	videos: { slug: string }[];
	// to pick the video to download when there are multiple
	onSelectVideos?: () => void;
	className?: string;
	iconClassName?: string;
}) => {
	const { download, label, icon, onPress } = useDownloadAction(
		videos.map((x) => x.slug),
	);
	const percent = useDownloadPercent(download);

	if (!canDownload || !videos.length) return null;
	return (
		<PressableFeedback
			onPress={videos.length > 1 ? onSelectVideos : onPress}
			className={cn(
				"flex-row items-center self-center overflow-hidden rounded-full p-2 outline-0",
				"highlighted:bg-gray-400/50",
				className,
			)}
			{...tooltip(label)}
		>
			<Icon
				icon={icon}
				className={cn(
					download?.status === "done" && "fill-accent dark:fill-accent",
					download?.status === "failed" && "fill-red-500 dark:fill-red-500",
					iconClassName,
				)}
			/>
			{(download?.status === "downloading" ||
				download?.status === "preparing") && (
				<SubP className="ml-1">{percent}%</SubP>
			)}
		</PressableFeedback>
	);
};

export const DownloadMenuItem = ({ slug }: { slug: string }) => {
	const { label, icon, onPress } = useDownloadAction([slug]);

	if (!canDownload) return null;
	return <Menu.Item label={label} icon={icon} onSelect={onPress} />;
};

export const DownloadedBadge = ({
	videoIds,
	showId,
	className,
}: {
	videoIds?: string[];
	showId?: string;
	className?: string;
}) => {
	const { t } = useTranslation();
	const downloaded = useDownloads().some(
		(x) =>
			x.status === "done" &&
			(videoIds
				? videoIds.includes(x.id)
				: !!showId && x.video.show?.id === showId),
	);

	if (!downloaded) return null;
	return (
		<View
			className={cn("absolute rounded-full bg-gray-800/70 p-1", className)}
			{...tooltip(t("downloads.status.done"))}
		>
			<Icon icon={DownloadDone} className="h-4 w-4 fill-slate-200" />
		</View>
	);
};
