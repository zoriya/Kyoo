import {
	ImageBackground as EImageBackground,
	type ImageBackgroundProps,
} from "expo-image";
import type { ComponentProps, ReactNode } from "react";
import type { ImageStyle } from "react-native";
import { Platform, View } from "react-native";
import { withUniwind } from "uniwind";
import type { KImage } from "~/models";
import { useToken } from "~/providers/account-context";
import { cn } from "~/utils";
import { PosterPlaceholder } from "../image/image";

const ImgBg = withUniwind(EImageBackground);

// This should stay in think with `Image`.
// (copy-pasted but change `EImage` with `EImageBackground`)
// ALSO, remove `border-radius` (it's weird otherwise)
export const ImageBackground = ({
	src,
	quality,
	alt,
	className,
	children,
	...props
}: {
	src: KImage | null;
	quality: "low" | "medium" | "high";
	alt?: string;
	style?: ImageStyle;
	children: ReactNode;
} & Partial<ImageBackgroundProps>) => {
	const { apiUrl, authToken } = useToken();

	if (!src) {
		return (
			<View className={cn("overflow-hidden bg-gray-300", className)}>
				{children}
			</View>
		);
	}

	const uri = `${apiUrl}${src[quality ?? "high"]}`;
	return (
		<ImgBg
			recyclingKey={uri}
			source={{
				uri,
				// use cookies on web to allow `img` to make the call instead of js
				headers:
					authToken && Platform.OS !== "web"
						? {
								Authorization: `Bearer ${authToken}`,
							}
						: undefined,
			}}
			placeholder={{ blurhash: src?.blurhash }}
			accessibilityLabel={alt}
			className={cn("overflow-hidden bg-gray-300", className)}
			imageStyle={
				Platform.OS === "web"
					? { width: "100%", height: "100%", margin: 0, padding: 0 }
					: undefined
			}
			{...props}
		>
			{children}
		</ImgBg>
	);
};

export const PosterBackground = ({
	src,
	className,
	...props
}: ComponentProps<typeof ImageBackground>) => {
	if (!src) return <PosterPlaceholder className={className} {...props} />;
	return (
		<ImageBackground
			src={src}
			className={cn("aspect-2/3 overflow-hidden rounded", className)}
			{...props}
		/>
	);
};

export const ThumbnailBackground = ({
	src,
	className,
	...props
}: ComponentProps<typeof ImageBackground>) => {
	if (!src)
		return (
			<PosterPlaceholder className={cn("aspect-video", className)} {...props} />
		);
	return (
		<ImageBackground
			src={src}
			className={cn("aspect-video overflow-hidden rounded", className)}
			{...props}
		/>
	);
};
