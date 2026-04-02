import MoreVert from "@material-symbols/svg-400/rounded/more_vert.svg";
import MovieInfo from "@material-symbols/svg-400/rounded/movie_info.svg";
import Play from "@material-symbols/svg-400/rounded/play_arrow-fill.svg";
import Refresh from "@material-symbols/svg-400/rounded/refresh.svg";
import Search from "@material-symbols/svg-400/rounded/search-fill.svg";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import type { z } from "zod/v4";
import { ScanRequest, Video } from "~/models";
import {
	Button,
	DottedSeparator,
	HR,
	IconButton,
	Input,
	Link,
	Menu,
	P,
	Skeleton,
	SubP,
	tooltip,
	ts,
} from "~/primitives";
import {
	InfiniteFetch,
	type QueryIdentifier,
	useInfiniteFetch,
	useMutation,
} from "~/query";
import { cn, useQueryState } from "~/utils";
import { EmptyView } from "../empty-view";

type VideoT = z.infer<typeof Video>;

const ScanStatusBadge = ({
	status,
}: {
	status: "pending" | "running" | "failed" | null;
}) => {
	const { t } = useTranslation();
	if (!status) return null;

	return (
		<View
			className={cn(
				"rounded-md px-2 py-0.5",
				status === "pending" && "bg-card",
				status === "running" && "bg-accent/20",
				status === "failed" && "bg-popover",
			)}
		>
			<P className={cn("text-xs", status === "running" && "text-accent")}>
				{status === "pending" && t("admin.unmatched.status-pending")}
				{status === "running" && t("admin.unmatched.status-running")}
				{status === "failed" && t("admin.unmatched.status-failed")}
			</P>
		</View>
	);
};

const VideoItem = ({
	item,
	scanStatus,
}: {
	item: VideoT;
	scanStatus: ScanRequest | null;
}) => {
	const { t } = useTranslation();
	const [menuOpen, setMenuOpen] = useState(false);
	const episodes = item.guess.episodes;

	return (
		<View className="group flex-row">
			<Link
				href={menuOpen ? undefined : `/watch/${item.id}`}
				onLongPress={() => setMenuOpen(true)}
				className="flex-1 flex-row"
			>
				<View className="w-20 items-center">
					<IconButton
						icon={Play}
						iconClassName="fill-accent"
						{...tooltip(t("show.play"), true)}
					/>
					<ScanStatusBadge status={scanStatus?.status ?? null} />
				</View>
				<View className="mr-4 flex-1">
					<P className="wrap-anywhere flex-1 text-sm">{item.path}</P>
					<View className="mt-1 flex-row flex-wrap items-center gap-2">
						<SubP className="font-semibold">{item.guess.title}</SubP>
						{item.guess.kind && (
							<View className="rounded bg-card px-1.5 py-0.5">
								<SubP className="text-xs">{item.guess.kind}</SubP>
							</View>
						)}
						{episodes.length > 0 && (
							<SubP className="font-semibold">
								{episodes
									.map((x) => `S${x.season ?? "?"}E${x.episode}`)
									.join(", ")}
							</SubP>
						)}
						{item.version > 1 && <SubP>v{item.version}</SubP>}
					</View>
					{scanStatus?.status === "failed" && scanStatus.error && (
						<View className="mt-2 rounded bg-card p-2">
							<SubP className="text-xs">{scanStatus.error.message}</SubP>
						</View>
					)}
				</View>
			</Link>
			<IconButton
				icon={Search}
				as={Link}
				href={`/admin/match/${item.id}?q=${item.guess.title}`}
				{...tooltip(t("admin.unmatched.match"))}
			/>
			<Menu
				Trigger={IconButton}
				icon={MoreVert}
				isOpen={menuOpen}
				setOpen={setMenuOpen}
				{...tooltip(t("misc.more"))}
			>
				<Menu.Item
					label={t("admin.unmatched.match")}
					icon={Search}
					href={`/admin/match/${item.id}?q=${item.guess.title}`}
				/>
				<HR />
				<Menu.Item
					label={t("home.episodeMore.mediainfo")}
					icon={MovieInfo}
					href={`/info/${item.id}`}
				/>
			</Menu>
		</View>
	);
};

VideoItem.Loader = () => {
	return (
		<View className="flex-row px-2">
			<View className="w-20 items-center">
				<IconButton icon={Play} iconClassName="fill-accent" />
				<Skeleton className="h-3 w-3/5" />
			</View>
			<View className="flex-1 justify-center">
				<Skeleton className="h-4 w-3/4" />
				<View className="mt-2 flex-row gap-2">
					<Skeleton className="h-4 w-1/4" />
					<Skeleton className="h-4 w-12" />
				</View>
			</View>
		</View>
	);
};

const ScanProgress = ({ data }: { data: ScanRequest[] | undefined }) => {
	const { t } = useTranslation();
	if (!data) return null;

	const running = data.filter((x) => x.status === "running").length;
	const pending = data.filter((x) => x.status === "pending").length;
	const failed = data.filter((x) => x.status === "failed").length;

	if (running === 0 && pending === 0 && failed === 0) return null;

	const parts: { label: string; accent?: boolean }[] = [];
	if (running > 0)
		parts.push({
			label: t("admin.unmatched.progress-running", { count: running }),
			accent: true,
		});
	if (pending > 0)
		parts.push({
			label: t("admin.unmatched.progress-pending", { count: pending }),
		});
	if (failed > 0)
		parts.push({
			label: t("admin.unmatched.progress-failed", { count: failed }),
		});

	return (
		<View className="flex-row flex-wrap items-center">
			{parts.map((part, i) => (
				<View key={part.label} className="flex-row items-center">
					{i > 0 && <DottedSeparator />}
					<SubP className={cn(part.accent && "text-accent")}>{part.label}</SubP>
				</View>
			))}
		</View>
	);
};

const UnmatchedHeader = ({
	search,
	setSearch,
	scanData,
}: {
	search: string;
	setSearch: (q: string) => void;
	scanData: ScanRequest[] | undefined;
}) => {
	const { t } = useTranslation();
	const rescan = useMutation({
		method: "PUT",
		path: ["scanner", "scan"],
		invalidate: null,
	});

	return (
		<View className="m-2 mt-4 flex-1 gap-4">
			<View className="flex-1 flex-row flex-wrap items-center justify-between gap-3">
				<Input
					value={search}
					onChangeText={setSearch}
					placeholder={t("admin.unmatched.search")}
					right={<IconButton icon={Search} {...tooltip(t("navbar.search"))} />}
				/>
				<View className="flex-row items-center gap-2">
					<ScanProgress data={scanData} />
					<Button
						text={t("admin.unmatched.rescan")}
						icon={Refresh}
						onPress={async () => {
							await rescan.mutateAsync();
						}}
					/>
				</View>
			</View>
			<HR />
		</View>
	);
};

export const UnmatchedPage = () => {
	const { t } = useTranslation();
	const [search, setSearch] = useQueryState("q", "");

	const { items: scanData } = useInfiniteFetch(UnmatchedPage.scanQuery());
	const scanMap = useMemo(() => {
		if (!scanData) return new Map<string, ScanRequest>();
		const map = new Map<string, ScanRequest>();
		for (const request of scanData) {
			for (const videoId of request.videos) {
				map.set(videoId, request);
			}
		}
		return map;
	}, [scanData]);

	return (
		<InfiniteFetch
			query={UnmatchedPage.query(search)}
			incremental
			layout={{
				layout: "vertical",
				numColumns: 1,
				size: 100,
				gap: ts(0),
			}}
			Header={
				<UnmatchedHeader
					search={search}
					setSearch={setSearch}
					scanData={scanData}
				/>
			}
			Render={({ item }) => (
				<VideoItem item={item} scanStatus={scanMap.get(item.id) ?? null} />
			)}
			Loader={() => <VideoItem.Loader />}
			Divider
			Empty={<EmptyView message={t("admin.unmatched.empty")} />}
		/>
	);
};

UnmatchedPage.query = (search?: string): QueryIdentifier<VideoT> => ({
	parser: Video,
	path: ["api", "videos", "unmatched"],
	params: {
		query: search,
	},
	infinite: true,
	refetchInterval: 5000,
});

UnmatchedPage.scanQuery = (): QueryIdentifier<ScanRequest> => ({
	parser: ScanRequest,
	path: ["scanner", "scan"],
	infinite: true,
	refetchInterval: 5000,
	options: {
		returnError: true,
	},
});
