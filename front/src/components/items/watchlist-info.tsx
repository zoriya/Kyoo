import BookmarkAdd from "@material-symbols/svg-400/rounded/bookmark_add.svg";
import BookmarkAdded from "@material-symbols/svg-400/rounded/bookmark_added-fill.svg";
import BookmarkRemove from "@material-symbols/svg-400/rounded/bookmark_remove.svg";
import Bookmark from "@material-symbols/svg-400/rounded/bookmark-fill.svg";
import { eq, or, useDbClient, useLiveQuery } from "@tanstack/react-db";
import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import type { PressableProps } from "react-native";
import type { Serie } from "~/models";
import { IconButton, Menu, tooltip } from "~/primitives";
import { shows, watchStatusOf } from "~/db";
import { useAccount } from "~/providers/account-context";

type WatchStatus = NonNullable<Serie["watchStatus"]>["status"];
const WatchStatus = [
	"completed",
	"watching",
	"rewatching",
	"dropped",
	"planned",
] as const;

export const watchListIcon = (status: WatchStatus | null) => {
	switch (status) {
		case null:
			return BookmarkAdd;
		case "completed":
			return BookmarkAdded;
		case "dropped":
			return BookmarkRemove;
		default:
			return Bookmark;
	}
};

export const WatchListInfo = ({
	kind,
	slug,
	status,
	...props
}: {
	kind: "movie" | "serie" | "episode";
	slug: string;
	status: WatchStatus | null;
} & Partial<ComponentProps<typeof IconButton<PressableProps>>>) => {
	const account = useAccount();
	const { t } = useTranslation();

	const client = useDbClient();
	const { data: row } = useLiveQuery((q) =>
		q
			.from({ s: shows })
			.where(({ s }) => or(eq(s.slug, slug), eq(s.id, slug)))
			.findOne(),
	);
	// The local row is edited optimistically and every screen showing it follows.
	const mutate = (newStatus: WatchStatus | null) => {
		if (!row || row.kind === "collection") return;
		client.collection(shows).update(row.id, (d) => {
			if (d.kind !== "collection") d.watchStatus = watchStatusOf(d, newStatus);
		});
	};
	const displayStatus =
		row && row.kind !== "collection"
			? (row.watchStatus?.status ?? null)
			: status;

	if (account == null) {
		return (
			<IconButton
				icon={BookmarkAdd}
				disabled
				{...tooltip(t("show.watchlistLogin"))}
				{...props}
			/>
		);
	}

	switch (displayStatus) {
		case null:
			return (
				<IconButton
					icon={BookmarkAdd}
					onPress={() => mutate("planned")}
					{...tooltip(t("show.watchlistAdd"))}
					{...props}
				/>
			);
		case "completed":
			return (
				<IconButton
					icon={BookmarkAdded}
					onPress={() => mutate(null)}
					{...tooltip(t("show.watchlistRemove"))}
					{...props}
				/>
			);
		case "planned":
		case "watching":
		case "rewatching":
		case "dropped":
			return (
				<Menu
					Trigger={IconButton}
					icon={watchListIcon(displayStatus)}
					{...tooltip(t("show.watchlistEdit"))}
					{...(props as any)}
				>
					{() => (
						<>
							{Object.values(WatchStatus).map((x) => (
								<Menu.Item
									key={x}
									label={t(`show.watchlistMark.${x}`)}
									onSelect={() => mutate(x)}
									selected={x === displayStatus}
								/>
							))}
							<Menu.Item
								label={t("show.watchlistMark.null")}
								onSelect={() => mutate(null)}
							/>
						</>
					)}
				</Menu>
			);
		default:
			return exhaustiveCheck(displayStatus);
	}
};

function exhaustiveCheck(v: never): never {
	return v;
}
