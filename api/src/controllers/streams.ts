import { TypeCompiler } from "@sinclair/typebox/compiler";
import { and, desc, eq, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { auth } from "~/auth";
import { db } from "~/db";
import { history, profiles, videos } from "~/db/schema";
import { sqlarr } from "~/db/utils";
import { Entry } from "~/models/entry";
import { KError } from "~/models/error";
import { Show } from "~/models/show";
import { User } from "~/models/user";
import { AcceptLanguage, processLanguages } from "~/models/utils";
import { uniq } from "~/utils";
import { getVideos } from "./videos";

const TranscodeStatus = t.Object({
	index: t.Integer(),
	quality: t.String(),
	heads: t.Array(
		t.Object({
			start: t.Number(),
			end: t.Number(),
			startHead: t.Integer(),
			endHead: t.Integer(),
			isRunning: t.Boolean(),
		}),
	),
});

const ViewerTrack = t.Object({
	index: t.Integer(),
	quality: t.String(),
	head: t.Integer(),
});

const TranscoderViewer = t.Object({
	clientId: t.String(),
	profileId: t.Nullable(t.String({ format: "uuid" })),
	sessionId: t.Nullable(t.String()),
	video: t.Nullable(ViewerTrack),
	audio: t.Nullable(ViewerTrack),
});

const TranscoderStream = t.Object({
	path: t.String(),
	sha: t.String(),
	duration: t.Number(),
	videos: t.Array(TranscodeStatus),
	audios: t.Array(TranscodeStatus),
	viewers: t.Array(TranscoderViewer),
});
type TranscoderStream = typeof TranscoderStream.static;
const TranscoderStreamListC = TypeCompiler.Compile(t.Array(TranscoderStream));

const UserPageC = TypeCompiler.Compile(t.Object({ items: t.Array(User) }));

const RunningViewerTrack = t.Object({
	index: t.Integer(),
	quality: t.String(),
	head: t.Integer(),
});

const RunningStream = t.Object({
	id: t.String({ format: "uuid" }),
	path: t.String(),
	duration: t.Number(),
	videos: t.Array(TranscodeStatus),
	audios: t.Array(TranscodeStatus),
	viewers: t.Array(
		t.Object({
			user: t.Nullable(User),
			progress: t.Nullable(t.Number()),
			video: t.Nullable(RunningViewerTrack),
			audio: t.Nullable(RunningViewerTrack),
		}),
	),
	entries: t.Array(t.Omit(Entry, ["videos", "progress"])),
	show: t.Nullable(Show),
});

export const streamsH = new Elysia({ tags: ["videos"] }).use(auth).get(
	"videos/streams",
	// @ts-expect-error idk
	async ({
		headers: { authorization, "accept-language": langs },
		jwt: { sub, settings },
		status,
	}) => {
		let streams: TranscoderStream[];

		try {
			const response = await fetch(
				new URL(
					"/video/streams",
					process.env.TRANSCODER_SERVER ?? "http://transcoder:7666",
				),
				{
					headers: authorization ? { authorization } : undefined,
				},
			);

			if (!response.ok) {
				return status(502, {
					status: 502,
					message: "Cannot fetch running streams from transcoder.",
					details: await response.text(),
				});
			}

			streams = TranscoderStreamListC.Decode(await response.json());
		} catch (e) {
			return status(502, {
				status: 502,
				message: "Cannot reach transcoder service.",
				details: e,
			});
		}

		if (!streams.length) return [];

		const usersById = new Map<string, User>();
		try {
			const resp: Response = await fetch(
				new URL("/auth/users", process.env.AUTH_SERVER ?? "http://auth:4568"),
				{
					headers: authorization ? { authorization } : undefined,
				},
			);
			if (!resp.ok) {
				return status(502, {
					status: 502,
					message: "Cannot fetch users from auth service.",
					details: await resp.text(),
				});
			}

			const { items } = UserPageC.Decode(await resp.json());

			for (const user of items) {
				usersById.set(user.id, user);
			}
		} catch (e) {
			return status(502, {
				status: 502,
				message: "Cannot reach auth service.",
				details: e,
			});
		}

		const paths = streams.map((x) => x.path);
		const items = await getVideos({
			limit: paths.length,
			filter: eq(videos.path, sql`any(${sqlarr(paths)})`),
			languages: processLanguages(langs),
			preferOriginal: settings.preferOriginal,
			relations: ["show"],
			userId: sub,
		});

		const profileIds = uniq(
			streams
				.flatMap((x) => x.viewers.map((v) => v.profileId))
				.filter((x): x is string => !!x),
		);
		const videoIds = items.map((x) => x.id);
		const progress = new Map<string, number>();
		if (profileIds.length > 0 && videoIds.length > 0) {
			const progressRows = await db
				.selectDistinctOn([profiles.id, videos.id], {
					profileId: profiles.id,
					videoId: videos.id,
					time: history.time,
				})
				.from(history)
				.innerJoin(profiles, eq(history.profilePk, profiles.pk))
				.innerJoin(videos, eq(history.videoPk, videos.pk))
				.where(
					and(
						eq(profiles.id, sql`any(${sqlarr(profileIds)}::uuid[])`),
						eq(videos.id, sql`any(${sqlarr(videoIds)}::uuid[])`),
					),
				)
				.orderBy(profiles.id, videos.id, desc(history.playedDate));

			for (const row of progressRows) {
				progress.set(`${row.profileId}:${row.videoId}`, row.time);
			}
		}

		const videosByPath = new Map(items.map((x) => [x.path, x]));
		return streams.map((stream) => {
			const video = videosByPath.get(stream.path);
			return {
				id: video!.id,
				path: stream.path,
				duration: stream.duration,
				videos: stream.videos,
				audios: stream.audios,
				viewers: stream.viewers.map((viewer) => ({
					user: usersById.get(viewer.profileId ?? ""),
					progress: progress.get(`${viewer.profileId}:${video?.id}`) ?? null,
					video: viewer.video,
					audio: viewer.audio,
				})),
				entries: video?.entries ?? [],
				show: video?.show ?? null,
			};
		});
	},
	{
		detail: {
			description: "List currently running streams",
		},
		headers: t.Object({
			"accept-language": AcceptLanguage({ autoFallback: true }),
		}),
		permissions: ["users.read"],
		response: {
			200: t.Array(RunningStream),
			403: KError,
			422: KError,
			502: KError,
		},
	},
);
