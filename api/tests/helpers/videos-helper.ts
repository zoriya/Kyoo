import { buildUrl } from "tests/utils";
import { handlers } from "~/base";
import type { SeedVideo } from "~/models/video";
import { getJwtHeaders } from "./jwt";

export const createVideo = async (video: SeedVideo | SeedVideo[]) => {
	const resp = await handlers.handle(
		new Request(buildUrl("videos"), {
			method: "POST",
			body: JSON.stringify(Array.isArray(video) ? video : [video]),
			headers: {
				"Content-Type": "application/json",
				...(await getJwtHeaders()),
			},
		}),
	);
	const body = await resp.json();
	return [resp, body] as const;
};

export const getVideos = async () => {
	const resp = await handlers.handle(
		new Request(buildUrl("videos"), {
			method: "GET",
			headers: await getJwtHeaders(),
		}),
	);
	const body = await resp.json();
	return [resp, body] as const;
};

export const getVideo = async (
	id: string,
	{ langs, ...query }: { langs?: string; with?: string[] },
) => {
	const resp = await handlers.handle(
		new Request(buildUrl(`videos/${id}`, query), {
			method: "GET",
			headers: langs
				? {
						"Accept-Language": langs,
						...(await getJwtHeaders()),
					}
				: await getJwtHeaders(),
		}),
	);
	const body = await resp.json();
	return [resp, body] as const;
};

export const deleteVideo = async (paths: string[]) => {
	const resp = await handlers.handle(
		new Request(buildUrl("videos"), {
			method: "DELETE",
			body: JSON.stringify(paths),
			headers: {
				"Content-Type": "application/json",
				...(await getJwtHeaders()),
			},
		}),
	);
	const body = await resp.json();
	return [resp, body] as const;
};

export const linkVideos = async (
	links: { id: string; for: SeedVideo["for"] }[],
) => {
	const resp = await handlers.handle(
		new Request(buildUrl("videos/link"), {
			method: "POST",
			body: JSON.stringify(links),
			headers: {
				"Content-Type": "application/json",
				...(await getJwtHeaders()),
			},
		}),
	);
	const body = await resp.json();
	return [resp, body] as const;
};
