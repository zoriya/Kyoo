import { View, type ViewProps } from "react-native";
import type { FocusGroupProps } from "./focus";

export const FocusGroup = ({
	autoFocus: _autoFocus,
	trapFocusUp: _up,
	trapFocusDown: _down,
	trapFocusLeft: _left,
	trapFocusRight: _right,
	...props
}: FocusGroupProps) => {
	return <View {...(props as ViewProps)} />;
};
