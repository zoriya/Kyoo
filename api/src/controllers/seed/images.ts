import type { Image } from "~/models/utils";

// this will only push a task to the image downloader service and not download it instantly.
// this is both done to prevent to many requests to be sent at once and to make sure POST
// requests are not blocked by image downloading or blurhash calculation
export const processImage = (url: string): Image => {
	const hasher = new Bun.CryptoHasher("sha256");
	hasher.update(url);

	// TODO: download source, save it in multiples qualities & process blurhash

	return {
		id: hasher.digest().toString("hex"),
		source: url,
		blurhash: "",
	};
};

export const processOptImage = (url: string | null): Image | null => {
	if (!url) return null;
	return processImage(url);
};
