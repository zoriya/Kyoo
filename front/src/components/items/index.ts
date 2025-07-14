import type { ComponentProps } from "react";
import type { Show } from "~/models";
import { getDisplayDate } from "~/utils";
import { ItemGrid } from "./item-grid";
import { ItemList } from "./item-list";

export const itemMap = (
	item: Show,
): ComponentProps<typeof ItemGrid> & ComponentProps<typeof ItemList> => ({
	kind: item.kind,
	slug: item.slug,
	name: item.name,
	subtitle: item.kind !== "collection" ? getDisplayDate(item) : null,
	href: item.href,
	poster: item.poster,
	thumbnail: item.thumbnail,
	watchStatus:
		item.kind !== "collection" ? (item.watchStatus?.status ?? null) : null,
	watchPercent:
		item.kind === "movie" ? (item.watchStatus?.percent ?? null) : null,
	unseenEpisodesCount: 0,
	// 	item.kind === "serie" ? (item.watchStatus?.unseenEpisodesCount ?? item.episodesCount!) : null,
});

export { ItemGrid, ItemList };
