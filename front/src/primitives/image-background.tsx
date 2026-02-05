import { ImageBackground as EImageBackground } from "expo-image";
import type { ComponentProps, ReactNode } from "react";
import type { ImageStyle } from "react-native";
import { Platform } from "react-native";
import { withUniwind } from "uniwind";
import type { KImage } from "~/models";
import { useToken } from "~/providers/account-context";
import { cn } from "~/utils";
import { PosterPlaceholder } from "./image";

const ImgBg = withUniwind(EImageBackground);

// This should stay in think with `Image`.
// (copy-pasted but change `EImage` with `EImageBackground`)
// ALSO, remove `border-radius` (it's weird otherwise)
export const ImageBackground = ({
	src,
	quality,
	alt,
	className,
	...props
}: {
	src: KImage | null;
	quality: "low" | "medium" | "high";
	alt?: string;
	style?: ImageStyle;
	children: ReactNode;
	className?: string;
}) => {
	const { apiUrl, authToken } = useToken();

	const uri = src ? `${apiUrl}${src[quality ?? "high"]}` : null;
	return (
		<ImgBg
			recyclingKey={uri}
			source={{
				uri: uri!,
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
			{...props}
		/>
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
