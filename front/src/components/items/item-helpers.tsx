import Done from "@material-symbols/svg-400/rounded/check-fill.svg";
import { View } from "react-native";
import type { WatchStatusV } from "~/models";
import { Icon, P } from "~/primitives";

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
	if (watchStatus !== "completed" && !availableCount) return null;

	return (
		<View
			className="absolute top-0 left-0 m-1 aspect-square min-w-8 items-center justify-center rounded-full bg-gray-800/70 p-1"
			{...props}
		>
			{watchStatus === "completed" ? (
				<Icon icon={Done} className="fill-slate-400" />
			) : (
				<P className="text-center text-slate-400">
					{seenCount ?? 0}/{availableCount}
				</P>
			)}
		</View>
	);
};
