import { type HWEvent, View, type ViewProps } from "react-native";
import type { FocusGroupProps, FocusTrapProps } from "./focus";

export const useTVEventHandler = (_handler: (event: HWEvent) => void) => {};

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

export const FocusTrap = ({ onBack: _onBack, ...props }: FocusTrapProps) => {
	return <View {...(props as ViewProps)} />;
};
