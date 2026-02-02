import type { ComponentType } from "react";
import { Image, View, type ViewProps, type ViewStyle } from "react-native";
import { cn } from "~/utils";
import { Skeleton } from "./skeleton";
import { P } from "./text";

const stringToColor = (string: string) => {
	let hash = 0;

	for (let i = 0; i < string.length; i += 1) {
		hash = string.charCodeAt(i) + ((hash << 5) - hash);
	}

	let color = "#";
	for (let i = 0; i < 3; i += 1) {
		const value = (hash >> (i * 8)) & 0xff;
		color += `00${value.toString(16)}`.slice(-2);
	}
	return color;
};

export const Avatar = <AsProps = ViewProps>({
	src,
	alt,
	placeholder,
	className,
	style,
	as,
	...props
}: {
	src?: string;
	alt?: string;
	placeholder?: string;
	className?: string;
	style?: ViewStyle;
	as?: ComponentType<AsProps>;
} & AsProps) => {
	const Container = as ?? View;
	return (
		<Container
			className={cn("h-6 w-6 overflow-hidden rounded-full", className)}
			style={
				placeholder
					? { backgroundColor: stringToColor(placeholder), ...style }
					: style
			}
			{...(props as AsProps)}
		>
			{placeholder && (
				<P className="text-center text-slate-200 dark:text-slate-200">
					{placeholder[0]}
				</P>
			)}
			<Image
				resizeMode="cover"
				source={{ uri: src }}
				alt={alt}
				className="absolute inset-0"
			/>
		</Container>
	);
};

Avatar.Loader = ({ className, ...props }: { className?: string }) => {
	return (
		<Skeleton variant="round" className={cn("h-6 w-6", className)} {...props} />
	);
};
