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

// A held d-pad key repeats every ~50ms but each repeat restarts the ~250ms
// eased snap scroll from rest, so the list falls further and further behind the
// focus (until the focus reaches unrendered items and jumps away). While a key is
// held, use a linear scroll that ends right when the next repeat comes in.
export const useHeldScrollAnimation = (enabled = true) => {
	const [held, setHeld] = useState(false);
	useTVEventHandler(
		useEffectEvent((event: TVEvent) => {
			if (!enabled) return;
			if (event.eventType === "longUp" || event.eventType === "longDown")
				setHeld(event.eventKeyAction === 0);
		}),
	);
	return held
		? ({
				scrollAnimationDuration: 50,
				scrollAnimationEasing: "linear",
			} as const)
		: undefined;
};

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
