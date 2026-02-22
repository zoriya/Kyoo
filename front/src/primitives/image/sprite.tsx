import { Image } from "expo-image";
import { Platform, View, type ViewProps } from "react-native";
import { useToken } from "~/providers/account-context";
import { cn } from "~/utils";

export const Sprite = ({
	src,
	alt,
	width,
	height,
	x,
	y,
	rows,
	columns,
	style,
	className,
	...props
}: {
	src: string;
	alt: string;
	width: number;
	height: number;
	x: number;
	y: number;
	rows: number;
	columns: number;
} & ViewProps) => {
	const { authToken } = useToken();

	return (
		<View
			className={cn("overflow-hidden", className)}
			style={[style, { width, height }]}
			{...props}
		>
			<Image
				source={{
					uri: src,
					// use cookies on web to allow `img` to make the call instead of js
					headers:
						authToken && Platform.OS !== "web"
							? {
									Authorization: `Bearer ${authToken}`,
								}
							: undefined,
				}}
				alt={alt}
				style={{
					width: width * columns,
					height: height * rows,
					transform: [{ translateX: -x }, { translateY: -y }],
				}}
			/>
		</View>
	);
};
