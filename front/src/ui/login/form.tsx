import type { ReactNode } from "react";
import {
	ImageBackground,
	ScrollView,
	View,
	type ViewProps,
} from "react-native";
import { Path } from "react-native-svg";
import { Svg } from "~/primitives";
import { defaultApiUrl } from "~/providers/account-provider";
import { cn } from "~/utils";

const SvgBlob = ({ className, ...props }: ViewProps) => {
	return (
		<View className={cn("aspect-5/6 w-[90vh] max-w-5xl", className)} {...props}>
			<Svg
				width="100%"
				height="100%"
				viewBox="0 0 500 600"
				className="fill-background"
			>
				<Path d="M459.7 0c-20.2 43.3-40.3 86.6-51.7 132.6-11.3 45.9-13.9 94.6-36.1 137.6-22.2 43-64.1 80.3-111.5 88.2s-100.2-13.7-144.5-1.8C71.6 368.6 35.8 414.2 0 459.7V0h459.7z" />
			</Svg>
		</View>
	);
};

export const FormPage = ({
	children,
	apiUrl,
	className,
	...props
}: {
	children: ReactNode;
	apiUrl?: string;
	className?: string;
}) => {
	return (
		<ImageBackground
			source={{ uri: `${apiUrl ?? defaultApiUrl}/api/shows/random/thumbnail` }}
			className="flex-1 flex-row bg-dark"
		>
			<SvgBlob className="absolute top-0 left-0" />
			<ScrollView className="pr-6">
				<View
					className={cn(
						"max-w-xl rounded-[25rem] bg-background py-10 pl-6",
						className,
					)}
					{...props}
				>
					{children}
				</View>
			</ScrollView>
		</ImageBackground>
	);
};
