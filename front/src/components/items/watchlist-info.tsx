import BookmarkAdd from "@material-symbols/svg-400/rounded/bookmark_add.svg";
import BookmarkAdded from "@material-symbols/svg-400/rounded/bookmark_added-fill.svg";
import BookmarkRemove from "@material-symbols/svg-400/rounded/bookmark_remove.svg";
import Bookmark from "@material-symbols/svg-400/rounded/bookmark-fill.svg";
import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import type { PressableProps } from "react-native";
import { useMutation } from "~/data";
import { type Serie, Show } from "~/models";
import { IconButton, Menu, tooltip } from "~/primitives";
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

export const useWatchStatus = ({
	id,
	kind,
	slug,
}: {
	id: string;
	kind: Show["kind"];
	slug: string;
}) =>
	useMutation((status: WatchStatus | null) => ({
		method: status ? "POST" : "DELETE",
		path: ["api", `${kind}s`, slug, "watchstatus"],
		body: status ? { status } : undefined,
		optimisticSchema: Show,
		optimistic: (snap) => {
			const show = snap.get(Show, { id, kind });
			return {
				id,
				kind,
				slug,
				watchStatus: status
					? {
							score: null,
							startedAt: null,
							completedAt: null,
							seenCount: 0,
							percent: 0,
							...(show && "watchStatus" in show ? show.watchStatus : null),
							status,
						}
					: null,
			};
		},
		// seenCount, nextEntry & the entries' progress are computed by the api
		invalidate: ["api", `${kind}s`, slug],
	}));

export const WatchListInfo = ({
	id,
	kind,
	slug,
	status,
	...props
}: {
	id: string;
	kind: "movie" | "serie";
	slug: string;
	status: WatchStatus | null;
} & Partial<ComponentProps<typeof IconButton<PressableProps>>>) => {
	const account = useAccount();
	const { t } = useTranslation();
	const mutation = useWatchStatus({ id, kind, slug });

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

	switch (status) {
		case null:
			return (
				<IconButton
					icon={BookmarkAdd}
					onPress={() => mutation.mutate("planned")}
					{...tooltip(t("show.watchlistAdd"))}
					{...props}
				/>
			);
		case "completed":
			return (
				<IconButton
					icon={BookmarkAdded}
					onPress={() => mutation.mutate(null)}
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
					icon={watchListIcon(status)}
					{...tooltip(t("show.watchlistEdit"))}
					{...(props as any)}
				>
					{() => (
						<>
							{Object.values(WatchStatus).map((x) => (
								<Menu.Item
									key={x}
									label={t(`show.watchlistMark.${x}`)}
									onSelect={() => mutation.mutate(x)}
									selected={x === status}
								/>
							))}
							<Menu.Item
								label={t("show.watchlistMark.null")}
								onSelect={() => mutation.mutate(null)}
							/>
						</>
					)}
				</Menu>
			);
		default:
			return exhaustiveCheck(status);
	}
};

function exhaustiveCheck(v: never): never {
	return v;
}
