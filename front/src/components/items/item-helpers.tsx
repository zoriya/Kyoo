import Done from "@material-symbols/svg-400/rounded/check-fill.svg";
import { View } from "react-native";
import { max, rem, useYoshiki } from "yoshiki/native";
import type { WatchStatusV } from "~/models";
import { Icon, P, ts } from "~/primitives";

export const ItemWatchStatus = ({
	watchStatus,
	unseenEpisodesCount,
	...props
}: {
	watchStatus?: WatchStatusV | null;
	unseenEpisodesCount?: number | null;
}) => {
	const { css } = useYoshiki();

	if (watchStatus !== "completed" && !unseenEpisodesCount) return null;

	return (
		<View
			{...css(
				{
					position: "absolute",
					top: 0,
					right: 0,
					minWidth: max(rem(1), ts(3.5)),
					aspectRatio: 1,
					justifyContent: "center",
					alignItems: "center",
					m: ts(0.5),
					pX: ts(0.5),
					bg: (theme) => theme.darkOverlay,
					borderRadius: 999999,
				},
				props,
			)}
		>
			{watchStatus === "completed" ? (
				<Icon icon={Done} size={16} />
			) : (
				<P
					{...css({
						marginVertical: 0,
						verticalAlign: "middle",
						textAlign: "center",
					})}
				>
					{unseenEpisodesCount}
				</P>
			)}
		</View>
	);
};
