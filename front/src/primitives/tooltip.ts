import { ToastAndroid } from "react-native";

export const tooltip = (tooltip: string, _up?: boolean) => ({
	onLongPress: () => {
		ToastAndroid.show(tooltip, ToastAndroid.SHORT);
	},
});

import type { Tooltip as RTooltip } from "react-tooltip";
export const Tooltip: typeof RTooltip = (() => null) as any;
