import { View } from "react-native";
import { P } from "~/primitives";
import { cn } from "~/utils";

export const EmptyView = ({
	message,
	className,
}: {
	message: string;
	className?: string;
}) => {
	return (
		<View className={cn("flex-1 items-center justify-center py-20", className)}>
			<P>{message}</P>
		</View>
	);
};
