import type { ComponentProps } from "react";
import type { Show } from "~/models";
import { type PreferOriginal, showImages } from "~/models/utils/images";
import { getDisplayDate } from "~/utils";
import { ItemGrid } from "./item-grid";
import { ItemList } from "./item-list";

export const itemMap = (
	item: Show,
	preferOriginal: PreferOriginal,
): ComponentProps<typeof ItemGrid> & ComponentProps<typeof ItemList> => {
	const images = showImages(item, preferOriginal);
	return {
		id: item.id,
		kind: item.kind,
		slug: item.slug,
		name: item.name,
		subtitle: item.kind !== "collection" ? getDisplayDate(item) : null,
		href: item.href,
		poster: images.poster,
		banner: images.banner ?? images.thumbnail,
		watchStatus:
			item.kind !== "collection" ? (item.watchStatus?.status ?? null) : null,
		watchPercent:
			item.kind === "movie" ? (item.watchStatus?.percent ?? null) : null,
		availableCount: item.kind === "serie" ? item.availableCount : null,
		seenCount: item.kind === "serie" ? item.watchStatus?.seenCount : null,
		videoSlug:
			item.kind === "movie" && item.videos?.length === 1
				? item.videos[0].slug
				: null,
	};
};

export { ItemGrid, ItemList };
