import { Image as EImage } from "expo-image";
import type { ComponentProps } from "react";
import { type ImageStyle, Platform, View, type ViewProps } from "react-native";
import { withUniwind } from "uniwind";
import type { KImage } from "~/models";
import { useToken } from "~/providers/account-context";
import { cn } from "~/utils";
import KyooLogo from "~public/icon.svg";
import { Skeleton } from "../skeleton";
import { useIsImageReady } from "./ready";

const Img = withUniwind(EImage);

// This should stay in think with `ImageBackground`.
// (copy-pasted but change `EImageBackground` with `EImage`)
export const Image = ({
	src,
	quality,
	alt,
	className,
	style,
	contentFit = "cover",
	...props
}: {
	src: KImage | null;
	quality: "low" | "medium" | "high";
	alt?: string;
	style?: ImageStyle;
	className?: string;
	contentFit?: "cover" | "contain";
}) => {
	const { apiUrl, authToken } = useToken();
	const isReady = useIsImageReady(src);

	if (!src || !isReady) {
		return (
			<ImagePlaceholder
				accessibilityLabel={alt}
				className={cn("rounded", className)}
				style={style}
			/>
		);
	}

	const path = src[quality ?? "high"];
	const uri = !path || path.startsWith("http") ? path : `${apiUrl}${path}`;
	return (
		<Img
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
			placeholder={{ blurhash: src.blurhash }}
			accessibilityLabel={alt}
			contentFit={contentFit}
			className={cn("overflow-hidden rounded bg-gray-300", className)}
			style={style}
			{...props}
		/>
	);
};

Image.Loader = (props: { className?: string }) => {
	return <Skeleton variant="custom" {...props} />;
};

export const Poster = ({
	className,
	...props
}: ComponentProps<typeof Image>) => {
	return <Image className={cn("aspect-2/3", className)} {...props} />;
};

Poster.Loader = ({ className, ...props }: { className?: string }) => (
	<Image.Loader className={cn("aspect-2/3", className)} {...props} />
);

export const ImagePlaceholder = ({
	className,
	children,
	...props
}: ViewProps) => {
	return (
		<View className={cn("overflow-hidden bg-gray-300", className)} {...props}>
			<View className="absolute inset-0 items-center justify-center">
				<KyooLogo color="#1f1e2f" style={{ width: "50%", height: "50%" }} />
			</View>
			{children}
		</View>
	);
};
