import { View, type ViewProps } from "react-native";
import type { FocusGroupProps } from "./focus";

// The browser has no focus engine to guide: the dom order already is the tab
// order, and arrow keys inside a list are handled by the list itself.
export const FocusGroup = ({
	autoFocus: _autoFocus,
	destination: _destination,
	trapFocusUp: _up,
	trapFocusDown: _down,
	trapFocusLeft: _left,
	trapFocusRight: _right,
	...props
}: FocusGroupProps) => {
	return <View {...(props as ViewProps)} />;
};

// The browser gives the first tab press to the first element in the dom, which
// is what a keyboard user expects; nothing to hand over here.
export const preferFocus = (_prefer: boolean | null | undefined = true) => ({});
