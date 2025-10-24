import { VideoInfo } from "~/models";
import type { QueryIdentifier } from "~/query";

export const Info = () => {};

Info.infoQuery = (slug: string): QueryIdentifier<VideoInfo> => ({
	path: ["api", "videos", slug, "info"],
	parser: VideoInfo,
});
