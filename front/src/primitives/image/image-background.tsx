import {
	ImageBackground as EImageBackground,
	type ImageBackgroundProps,
} from "expo-image";
import type { ComponentProps, ReactNode } from "react";
import type { ImageStyle } from "react-native";
import { Platform } from "react-native";
import { withUniwind } from "uniwind";
import type { KImage } from "~/models";
import { useToken } from "~/providers/account-context";
import { cn } from "~/utils";
import { ImagePlaceholder } from "../image/image";
import { useIsImageReady } from "./ready";

const ImgBg = withUniwind(EImageBackground);

// muted pastel gradients shown when a background is missing or not downloaded yet
const placeholderBlurhashes = [
	"L9F}{l2wjug4{{NOjba$n%a#fRfQ",
	"L7ED9[8Mf$o}Msssa|jcaijvfRfR",
	"LHID%*xKjus;}hWFa}jtsmayfQfQ",
	"L5F$YTLbbatl4M$@j?k8bYbEfRfP",
	"LLHBJow[jts:}PkQfQj?smfjfQfQ",
];
const placeholderBlurhash = (seed = "") => {
	let hash = 0;
	for (let i = 0; i < seed.length; i++)
		hash = (hash * 31 + seed.charCodeAt(i)) | 0;
	return placeholderBlurhashes[Math.abs(hash) % placeholderBlurhashes.length];
};

// This should stay in think with `Image`.
// (copy-pasted but change `EImage` with `EImageBackground`)
// ALSO, remove `border-radius` (it's weird otherwise)
export const ImageBackground = ({
	src,
	quality,
	alt,
	className,
	children,
	style,
	...props
}: {
	src: KImage | null;
	quality: "low" | "medium" | "high";
	alt?: string;
	style?: ImageStyle;
	children: ReactNode;
} & Partial<ImageBackgroundProps>) => {
	const { apiUrl, authToken } = useToken();
	const isReady = useIsImageReady(src);
	const missing = !src || !isReady;

	const path = missing ? undefined : src[quality ?? "high"];
	const uri = !path || path.startsWith("http") ? path : `${apiUrl}${path}`;
	return (
		<ImgBg
			recyclingKey={uri}
			source={
				uri && {
					uri,
					// use cookies on web to allow `img` to make the call instead of js
					headers:
						authToken && Platform.OS !== "web"
							? {
									Authorization: `Bearer ${authToken}`,
								}
							: undefined,
				}
			}
			placeholder={{
				blurhash: missing ? placeholderBlurhash(src?.id) : src.blurhash,
			}}
			placeholderContentFit="cover"
			accessibilityLabel={alt}
			className={cn("overflow-hidden bg-gray-300", className)}
			style={style}
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
	const isReady = useIsImageReady(src);
	if (!src || !isReady)
		return (
			<ImagePlaceholder
				className={cn("aspect-2/3 rounded", className)}
				{...props}
			/>
		);
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
	const isReady = useIsImageReady(src);
	if (!src || !isReady)
		return (
			<ImagePlaceholder
				className={cn("aspect-video rounded", className)}
				{...props}
			/>
		);
	return (
		<ImageBackground
			src={src}
			className={cn("aspect-video overflow-hidden rounded", className)}
			{...props}
		/>
	);
};
