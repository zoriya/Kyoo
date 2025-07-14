import BookmarkAdd from "@material-symbols/svg-400/rounded/bookmark_add.svg";
import BookmarkAdded from "@material-symbols/svg-400/rounded/bookmark_added-fill.svg";
import BookmarkRemove from "@material-symbols/svg-400/rounded/bookmark_remove.svg";
import Bookmark from "@material-symbols/svg-400/rounded/bookmark-fill.svg";
import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import type { Serie } from "~/models";
import { IconButton, Menu, tooltip } from "~/primitives";
import { useAccount } from "~/providers/account-context";
import { useMutation } from "~/query";

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
	color: ComponentProps<typeof IconButton>["color"];
}) => {
	const account = useAccount();
	const { t } = useTranslation();

	const mutation = useMutation({
		path: [kind, slug, "watchStatus"],
		compute: (newStatus: WatchStatus | null) => ({
			method: newStatus ? "POST" : "DELETE",
			params: newStatus ? { status: newStatus } : undefined,
		}),
		invalidate: [kind, slug],
	});
	if (mutation.isPending) status = mutation.variables;

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
					{...props}
				>
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
				</Menu>
			);
		default:
			return exhaustiveCheck(status);
	}
};

function exhaustiveCheck(v: never): never {
	return v;
}
