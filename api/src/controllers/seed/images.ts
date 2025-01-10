import type { Image } from "~/models/utils";

export const processImage = async (url: string): Promise<Image> => {
	const hasher = new Bun.CryptoHasher("sha256");
	hasher.update(url);

	// TODO: download source, save it in multiples qualities & process blurhash

	return {
		id: hasher.digest().toString("hex"),
		source: url,
		blurhash: "",
	};
};

export const processOptImage = (url: string | null): Promise<Image | null> => {
	if (!url) return Promise.resolve(null);
	return processImage(url);
};
