import Star from "@material-symbols/svg-400/rounded/star-fill.svg";
import { View } from "react-native";
import { Icon, P, Skeleton } from "~/primitives";
import { cn } from "~/utils";

export const Rating = ({
	rating,
	className,
	textClassName,
	iconClassName,
	...props
}: {
	rating: number | null;
	className?: string;
	textClassName?: string;
	iconClassName?: string;
}) => {
	return (
		<View className={cn("flex-row items-center", className)} {...props}>
			<Icon icon={Star} className={cn("mr-1", iconClassName)} />
			<P className={cn("align-middle", textClassName)}>
				{rating ? rating / 10 : "??"} / 10
			</P>
		</View>
	);
};

Rating.Loader = ({
	className,
	textClassName,
	iconClassName,
	...props
}: {
	className?: string;
	textClassName?: string;
	iconClassName?: string;
}) => {
	return (
		<View className={cn("flex-row items-center", className)} {...props}>
			<Icon icon={Star} className={cn("mr-1", iconClassName)} />
			<Skeleton className={cn("w-8", textClassName)} />
		</View>
	);
};
