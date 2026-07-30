import PlayArrow from "@material-symbols/svg-400/rounded/play_arrow-fill.svg";
import { useTranslation } from "react-i18next";
import { FlatList, View } from "react-native";
import { z } from "zod/v4";
import { entryDisplayNumber } from "~/components/entries";
import {
	Episode,
	type KImage,
	MovieEntry,
	Show,
	Special,
	User,
} from "~/models";
import {
	Avatar,
	Container,
	H2,
	Heading,
	HR,
	IconButton,
	Image,
	Link,
	P,
	Skeleton,
	SubP,
	useBreakpointValue,
} from "~/primitives";
import { type QueryIdentifier, useFetch } from "~/query";
import { cn, uniq } from "~/utils";
import { EmptyView } from "../empty-view";
import { toTimerString } from "../player/controls/progress";

const Track = z.object({
	index: z.number(),
	quality: z.string(),
	heads: z.array(
		z.object({
			start: z.number(),
			end: z.number(),
			startHead: z.number(),
			endHead: z.number(),
			isRunning: z.boolean(),
		}),
	),
});
type Track = z.infer<typeof Track>;

const ViewerTrack = z.object({
	index: z.number(),
	quality: z.string(),
	head: z.number(),
});
type ViewerTrack = z.infer<typeof ViewerTrack>;

const Stream = z.object({
	id: z.string(),
	path: z.string(),
	duration: z.number(),
	show: Show.nullable(),
	entries: z.array(
		z.discriminatedUnion("kind", [
			Episode.omit({ progress: true, videos: true }),
			MovieEntry.omit({ progress: true, videos: true }),
			Special.omit({ progress: true, videos: true }),
		]),
	),
	viewers: z.array(
		z.object({
			user: User.nullable(),
			progress: z.number().nullable(),
			video: ViewerTrack.nullable(),
			audio: ViewerTrack.nullable(),
		}),
	),
	videos: z.array(Track),
	audios: z.array(Track),
});
type Stream = z.infer<typeof Stream>;

const StreamViewer = ({
	username,
	logo,
	progress,
	duration,
	video,
	audio,
}: {
	username: string;
	logo?: string;
	progress: number | null;
	duration: number;
	video: ViewerTrack | null;
	audio: ViewerTrack | null;
}) => {
	const { t } = useTranslation();

	return (
		<Link
			className={cn(
				"flex-row items-center gap-2 rounded-4xl p-1",
				"hover:bg-gray-400/50 focus-visible:bg-gray-400/50",
			)}
			href={`/profiles/${username}`}
		>
			<Avatar src={logo} placeholder={username} className="h-7 w-7" />
			<View className="min-w-0 flex-1">
				<P numberOfLines={1} className="font-semibold text-sm">
					{username}
				</P>
				<SubP numberOfLines={1}>
					{t("admin.streams.watching", {
						quality: uniq([video?.quality, audio?.quality])
							.filter((x) => x)
							.join(" / "),
					})}
				</SubP>
			</View>
			{progress && (
				<SubP>
					{`${toTimerString(progress, duration)}/${toTimerString(duration)}`}
				</SubP>
			)}
		</Link>
	);
};

const StreamProgressBar = ({
	index,
	quality,
	duration,
	heads,
	viewers,
}: {
	index: number;
	quality: string;
	duration: number;
	heads: Track["heads"];
	viewers: { id: string; username: string; logo?: string; progress: number }[];
}) => {
	return (
		<View className="gap-2">
			<SubP className="font-semibold">
				#{index} {quality}
			</SubP>
			<View className="relative h-6 rounded bg-slate-800">
				{heads.map((head, headIndex) => (
					<View
						key={`${headIndex}-${head.start}-${head.end}`}
						className={cn(
							"absolute inset-y-0",
							head.isRunning ? "bg-amber-500/70" : "bg-emerald-500/60",
						)}
						style={{
							left: `${(head.start / duration) * 100}%`,
							width: `${Math.max(((head.end - head.start) / duration) * 100, 0.75)}%`,
						}}
					/>
				))}
				{viewers.map((viewer) => (
					<View
						key={viewer.id}
						className="absolute -top-2"
						style={{ left: `${(viewer.progress / duration) * 100}%` }}
					>
						<Avatar
							src={viewer.logo}
							placeholder={viewer.username}
							className="h-5 w-5 -translate-x-1/2 ring-1 ring-slate-950"
						/>
					</View>
				))}
			</View>
		</View>
	);
};

const StreamCard = ({
	id,
	path,
	name,
	thumbnail,
	duration,
	viewers,
	videos,
	audios,
}: {
	id: string;
	path: string;
	name: string | null;
	thumbnail: KImage | null;
	duration: number;
	viewers: Stream["viewers"];
	videos: Stream["videos"];
	audios: Stream["videos"];
}) => {
	const { t } = useTranslation();

	return (
		<View
			className={cn(
				"group rounded-md bg-card p-4 outline-0",
				"ring-accent hover:ring-3 focus-visible:ring-3",
			)}
		>
			<Image
				src={thumbnail}
				quality="low"
				className="mb-3 aspect-video w-full rounded"
			/>
			<View className="mb-3 flex-row items-center gap-2">
				<IconButton
					as={Link}
					icon={PlayArrow}
					href={`/watch/${id}`}
					iconClassName="fill-accent dark:fill-accent"
				/>
				<Heading className="flex-1 font-semibold">{name}</Heading>
			</View>
			<P numberOfLines={2} className="wrap-anywhere mb-3 text-sm">
				{path}
			</P>
			<HR />
			<View className="mt-3 gap-2">
				<SubP className="font-semibold uppercase">
					{t("admin.streams.viewers")}
				</SubP>
				{viewers.length === 0 ? (
					<SubP>{t("admin.streams.noActiveViewer")}</SubP>
				) : (
					viewers.map((x, i) => (
						<StreamViewer
							key={i}
							username={x.user?.username ?? t("admin.streams.guest")}
							logo={x.user?.logo}
							progress={x.progress}
							duration={duration}
							video={x.video}
							audio={x.audio}
						/>
					))
				)}
			</View>
			<HR className="my-3" />
			<View className="gap-2">
				<SubP className="font-semibold uppercase">
					{t("admin.streams.runningVideoTranscodes")}
				</SubP>
				<View className="gap-3">
					{videos.length === 0 ? (
						<SubP>{t("admin.streams.none")}</SubP>
					) : (
						videos.map((video) => (
							<StreamProgressBar
								key={`${video.index}-${video.quality}`}
								index={video.index}
								quality={video.quality}
								duration={duration}
								heads={video.heads}
								viewers={viewers
									.filter(
										(x) =>
											x.progress &&
											x.video?.quality === video.quality &&
											x.video?.index === video.index,
									)
									.map((x, i) => ({
										id: x.user?.id ?? i.toString(),
										username: x.user?.username ?? t("admin.streams.guest"),
										logo: x.user?.logo,
										progress: x.progress!,
									}))}
							/>
						))
					)}
				</View>
				<SubP className="font-semibold uppercase">
					{t("admin.streams.runningAudioTranscodes")}
				</SubP>
				<View className="gap-3">
					{audios.length === 0 ? (
						<SubP>{t("admin.streams.none")}</SubP>
					) : (
						audios.map((audio) => (
							<StreamProgressBar
								key={`${audio.index}-${audio.quality}`}
								index={audio.index}
								quality={audio.quality}
								duration={duration}
								heads={audio.heads}
								viewers={viewers
									.filter(
										(x) =>
											x.progress &&
											x.audio?.quality === audio.quality &&
											x.audio?.index === audio.index,
									)
									.map((x, i) => ({
										id: x.user?.id ?? i.toString(),
										username: x.user?.username ?? t("admin.streams.guest"),
										logo: x.user?.logo,
										progress: x.progress!,
									}))}
							/>
						))
					)}
				</View>
				<View className="mb-1 flex-row items-center gap-3">
					<View className="flex-row items-center gap-1">
						<View className="h-2 w-2 rounded-sm bg-emerald-500/60" />
						<SubP>{t("admin.streams.progress.available")}</SubP>
					</View>
					<View className="flex-row items-center gap-1">
						<View className="h-2 w-2 rounded-sm bg-amber-500/70" />
						<SubP>{t("admin.streams.progress.transcoding")}</SubP>
					</View>
				</View>
			</View>
		</View>
	);
};

StreamCard.Loader = () => {
	return (
		<View className="rounded-md border border-slate-700 bg-slate-900/40 p-4">
			<Skeleton className="mb-2 h-5 w-3/4" />
			<Skeleton className="mb-2 h-4 w-2/3" />
			<Skeleton className="mb-3 h-9" />
			<HR />
			<View className="mt-3 gap-2">
				<Skeleton className="h-4 w-1/4" />
				<View className="flex-row items-center gap-2">
					<Avatar.Loader className="h-7 w-7" />
					<Skeleton className="h-4 flex-1" />
				</View>
			</View>
		</View>
	);
};

export const AdminStreamsPage = () => {
	const { t } = useTranslation();
	const { data } = useFetch(AdminStreamsPage.query());
	const columns = useBreakpointValue({ xs: 1, md: 2, xl: 3 });

	if (!data) {
		return (
			<Container className="py-4">
				<H2 className="mb-2">{t("admin.streams.title")}</H2>
				<SubP className="mb-4">{t("admin.streams.subtitle")}</SubP>
				<View className="flex-row flex-wrap">
					{Array.from({ length: 6 }).map((_, index) => (
						<View
							key={index}
							className={cn(
								"p-1",
								columns === 1 ? "w-full" : "w-1/2",
								columns > 2 && "xl:w-1/3",
							)}
						>
							<StreamCard.Loader />
						</View>
					))}
				</View>
			</Container>
		);
	}

	if (data.length === 0) {
		return (
			<Container className="py-4">
				<H2 className="mb-2">{t("admin.streams.title")}</H2>
				<SubP className="mb-4">{t("admin.streams.subtitle")}</SubP>
				<EmptyView message={t("admin.streams.empty")} />
			</Container>
		);
	}

	return (
		<FlatList
			key={columns}
			data={data}
			numColumns={columns}
			ListHeaderComponent={
				<View>
					<H2 className="mb-2">{t("admin.streams.title")}</H2>
					<SubP className="mb-4">{t("admin.streams.subtitle")}</SubP>
				</View>
			}
			contentContainerClassName={Container.className}
			keyExtractor={(item) => item.id}
			renderItem={({ item }) => (
				<View
					className={cn(
						"p-1",
						columns === 1 && "w-full",
						columns === 2 && "w-1/2",
						columns === 3 && "xl:w-1/3",
					)}
				>
					<StreamCard
						id={item.id}
						path={item.path}
						thumbnail={
							item.entries[0]?.thumbnail ?? item.show?.thumbnail ?? null
						}
						name={
							(item.entries[0] && item.show?.kind === "serie"
								? `${item.show.name} - ${entryDisplayNumber(item.entries[0])}`
								: item.show?.name) ?? item.path
						}
						duration={item.duration}
						viewers={item.viewers}
						videos={item.videos}
						audios={item.audios}
					/>
				</View>
			)}
		/>
	);
};

AdminStreamsPage.query = (): QueryIdentifier<Stream[]> => ({
	parser: z.array(Stream),
	path: ["api", "videos", "streams"],
	refetchInterval: 5000,
});
