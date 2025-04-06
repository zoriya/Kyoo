import { buildUrl } from "tests/utils";
import { app } from "~/base";
import type { SeedVideo } from "~/models/video";
import { getJwtHeaders } from "./jwt";

export const createVideo = async (video: SeedVideo | SeedVideo[]) => {
	const resp = await app.handle(
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
