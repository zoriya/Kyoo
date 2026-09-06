import {
	type ComponentProps,
	useEffect,
	useEffectEvent,
	useState,
} from "react";
import { BackHandler, TVFocusGuideView } from "react-native";
import { withUniwind } from "uniwind";

export const FocusGroup = withUniwind(TVFocusGuideView);
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
			hasTVPreferredFocus={mounted}
			trapFocusUp
			trapFocusDown
			trapFocusLeft
			trapFocusRight
			{...props}
		/>
	);
};
