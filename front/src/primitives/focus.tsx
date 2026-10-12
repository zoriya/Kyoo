import {
	type ComponentProps,
	useEffect,
	useEffectEvent,
	useState,
} from "react";
import { BackHandler, Platform, TVFocusGuideView, View } from "react-native";
import { withUniwind } from "uniwind";

export { useTVEventHandler } from "react-native";

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
