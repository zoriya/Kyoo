import {
	type ComponentProps,
	useEffect,
	useEffectEvent,
	useState,
} from "react";
import {
	BackHandler,
	Platform,
	TVFocusGuideView,
	type TVRemoteEvent,
	useTVEventHandler as useRNTVEventHandler,
	View,
} from "react-native";
import { withUniwind } from "uniwind";

// rn types eventKeyAction as a string but native sends 0 (press) or 1 (release)
export type TVEvent = Omit<TVRemoteEvent, "eventKeyAction"> & {
	eventKeyAction?: number;
};
export const useTVEventHandler = useRNTVEventHandler as unknown as (
	handler: (event: TVEvent) => void,
) => void;

const TVFocusGroup = withUniwind(TVFocusGuideView);
// focus guides are useless without a remote and they steal the focus on touch devices
export const FocusGroup = (
	Platform.isTV ? TVFocusGroup : View
) as typeof TVFocusGroup;
export type FocusGroupProps = ComponentProps<typeof FocusGroup>;
export type FocusTrapProps = { onBack?: () => void } & FocusGroupProps;

export const FocusTrap = ({ onBack, ...props }: FocusTrapProps) => {
	const [mounted, setMounted] = useState(false);
	const back = useEffectEvent(() => {
		if (!onBack) return false;
		onBack();
		return true;
	});

	useEffect(() => {
		setMounted(true);
		const sub = BackHandler.addEventListener("hardwareBackPress", () => back());
		return () => sub.remove();
	}, []);

	return (
		<FocusGroup
			autoFocus
			hasTVPreferredFocus={Platform.isTV && mounted}
			trapFocusUp
			trapFocusDown
			trapFocusLeft
			trapFocusRight
			{...props}
		/>
	);
};
