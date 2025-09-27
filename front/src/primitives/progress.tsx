import { ActivityIndicator } from "react-native";
import { type Stylable, useYoshiki } from "yoshiki/native";

export const CircularProgress = ({
	size = 48,
	tickness = 5,
	color,
	...props
}: { size?: number; tickness?: number; color?: string } & Stylable) => {
	const { theme } = useYoshiki();

	return (
		<ActivityIndicator size={size} color={color ?? theme.accent} {...props} />
	);
};
