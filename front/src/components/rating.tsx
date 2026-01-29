import Star from "@material-symbols/svg-400/rounded/star-fill.svg";
import { View } from "react-native";
import { Icon, P, Skeleton } from "~/primitives";
import { cn } from "~/utils";

export const Rating = ({
	rating,
	className,
	...props
}: {
	rating: number | null;
	className?: string;
}) => {
	return (
		<View className={cn("flex-row items-center", className)} {...props}>
			<Icon icon={Star} className="mr-1" />
			<P className="align-middle">{rating ? rating / 10 : "??"} / 10</P>
		</View>
	);
};

Rating.Loader = ({ className, ...props }: { className?: string }) => {
	return (
		<View className={cn("flex-row items-center", className)} {...props}>
			<Icon icon={Star} className="mr-1" />
			<Skeleton className="w-8" />
		</View>
	);
};
