import type { ComponentType } from "react";
import { View, type ViewProps } from "react-native";
import { cn } from "~/utils";

export const Container = <AsProps = ViewProps>({
	className,
	as,
	...props
}: {
	className?: string;
	as?: ComponentType<AsProps>;
} & AsProps) => {
	const As = as ?? View;
	return (
		<As
			className={cn(
				"flex w-full flex-1 self-center px-4",
				"sm:w-xl md:w-3xl lg:w-5xl xl:w-7xl",
				className,
			)}
			{...(props as AsProps)}
		/>
	);
};
