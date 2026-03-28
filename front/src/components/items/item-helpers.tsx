import { useTranslation } from "react-i18next";
import { View } from "react-native";
import type { WatchStatusV } from "~/models";
import { tooltip } from "~/primitives";
import { cn } from "~/utils";

export const ItemWatchStatus = ({
	watchStatus,
	availableCount,
	seenCount,
	...props
}: {
	watchStatus?: WatchStatusV | null;
	availableCount?: number | null;
	seenCount?: number | null;
}) => {
	const { t } = useTranslation();

	if (!watchStatus && !availableCount) return null;

	return (
		<View
			className={cn(
				"absolute top-0 left-0 m-2 aspect-square w-4 rounded-full p-1",
				"bg-gray-800/70",
				watchStatus === "completed" && "bg-sky-500",
				watchStatus === "watching" && "bg-emerald-500",
				watchStatus === "rewatching" && "bg-teal-500",
				watchStatus === "dropped" && "bg-rose-500",
				watchStatus === "planned" && "bg-amber-500",
			)}
			{...tooltip(
				[
					watchStatus && t(`profile.statuses.${watchStatus}`),
					availableCount && `${seenCount ?? 0}/${availableCount ?? 0}`,
				]
					.filter((x) => x)
					.join(" · "),
			)}
			{...props}
		/>
	);
};
