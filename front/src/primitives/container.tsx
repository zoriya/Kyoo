import { View, type ViewProps } from "react-native";
import { cn } from "~/utils";

export const Container = ({ className, ...props }: ViewProps) => {
	return <View className={cn(Container.className, className)} {...props} />;
};

Container.className = cn(
	"flex w-full self-center px-4",
	"sm:w-xl md:w-3xl lg:w-5xl xl:w-7xl",
	"max-w-[92vw]",
);
