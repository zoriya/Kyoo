import { ActivityIndicator } from "react-native";
import { cn } from "~/utils";

export const CircularProgress = ({
	tickness = 5,
	...props
}: {
	tickness?: number;
	className?: string;
}) => {
	return (
		<ActivityIndicator
			colorClassName={cn("accent-accent")}
			size="large"
			{...props}
		/>
	);
};
