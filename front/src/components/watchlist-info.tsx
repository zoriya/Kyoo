import Bookmark from "@material-symbols/svg-400/rounded/bookmark-fill.svg";
import BookmarkAdd from "@material-symbols/svg-400/rounded/bookmark_add.svg";
import BookmarkAdded from "@material-symbols/svg-400/rounded/bookmark_added-fill.svg";
import BookmarkRemove from "@material-symbols/svg-400/rounded/bookmark_remove.svg";
import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { WatchStatusV } from "~/models";
import { IconButton, Menu, tooltip } from "~/primitives";
import { useAccount } from "~/providers/account-context";
import { useMutation } from "~/query";

export const watchListIcon = (status: WatchStatusV | null) => {
	switch (status) {
		case null:
			return BookmarkAdd;
		case WatchStatusV.Completed:
			return BookmarkAdded;
		case WatchStatusV.Droped:
			return BookmarkRemove;
		default:
			return Bookmark;
	}
};

export const WatchListInfo = ({
	type,
	slug,
	status,
	...props
}: {
	type: "movie" | "show" | "episode";
	slug: string;
	status: WatchStatusV | null;
	color: ComponentProps<typeof IconButton>["color"];
}) => {
	const account = useAccount();
	const { t } = useTranslation();

	const mutation = useMutation({
		path: [type, slug, "watchStatus"],
		compute: (newStatus: WatchStatusV | null) => ({
			method: newStatus ? "POST" : "DELETE",
			params: newStatus ? { status: newStatus } : undefined,
		}),
		invalidate: [type, slug],
	});
	if (mutation.isPending) status = mutation.variables;

	if (account == null) {
		return (
			<IconButton icon={BookmarkAdd} disabled {...tooltip(t("show.watchlistLogin"))} {...props} />
		);
	}

	switch (status) {
		case null:
			return (
				<IconButton
					icon={BookmarkAdd}
					onPress={() => mutation.mutate(WatchStatusV.Planned)}
					{...tooltip(t("show.watchlistAdd"))}
					{...props}
				/>
			);
		case WatchStatusV.Completed:
			return (
				<IconButton
					icon={BookmarkAdded}
					onPress={() => mutation.mutate(null)}
					{...tooltip(t("show.watchlistRemove"))}
					{...props}
				/>
			);
		case WatchStatusV.Planned:
		case WatchStatusV.Watching:
		case WatchStatusV.Droped:
			return (
				<Menu
					Trigger={IconButton}
					icon={watchListIcon(status)}
					{...tooltip(t("show.watchlistEdit"))}
					{...props}
				>
					{Object.values(WatchStatusV).map((x) => (
						<Menu.Item
							key={x}
							label={t(`show.watchlistMark.${x.toLowerCase() as Lowercase<WatchStatusV>}`)}
							onSelect={() => mutation.mutate(x)}
							selected={x === status}
						/>
					))}
					<Menu.Item label={t("show.watchlistMark.null")} onSelect={() => mutation.mutate(null)} />
				</Menu>
			);
		default:
			return exhaustiveCheck(status);
	}
};

function exhaustiveCheck(v: never): never {
	return v;
}
