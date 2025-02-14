import { useSafeAreaInsets } from "react-native-safe-area-context";

export const usePageStyle = () => {
	const insets = useSafeAreaInsets();
	return { paddingBottom: insets.bottom } as const;
};
