import { Image as EImage } from "expo-image";
import KyooLogo from "public/icon.svg";
import type { ComponentProps } from "react";
import { type ImageStyle, Platform, View, type ViewProps } from "react-native";
import { withUniwind } from "uniwind";
import type { YoshikiStyle } from "yoshiki/src/type";
import type { KImage } from "~/models";
import { useToken } from "~/providers/account-context";
import { cn } from "~/utils";
import { Skeleton } from "../skeleton";

export type YoshikiEnhanced<Style> = Style extends any
	? {
			[key in keyof Style]: YoshikiStyle<Style[key]>;
		}
	: never;

const Img = withUniwind(EImage);

// This should stay in think with `ImageBackground`.
// (copy-pasted but change `EImageBackground` with `EImage`)
export const Image = ({
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
	className?: string;
}) => {
	const { apiUrl, authToken } = useToken();

	if (!src) {
		return (
			<View className={cn("overflow-hidden rounded bg-gray-300", className)} />
		);
	}

	const uri = `${apiUrl}${src[quality ?? "high"]}`;
	return (
		<Img
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
			className={cn("overflow-hidden rounded bg-gray-300", className)}
			{...props}
		/>
	);
};

Image.Loader = (props: { className?: string }) => {
	return <Skeleton variant="custom" {...props} />;
};

export const Poster = ({
	src,
	className,
	...props
}: ComponentProps<typeof Image>) => {
	if (!src) return <PosterPlaceholder className={className} {...props} />;

	return <Image src={src} className={cn("aspect-2/3", className)} {...props} />;
};

Poster.Loader = ({ className, ...props }: { className?: string }) => (
	<Image.Loader className={cn("aspect-2/3", className)} {...props} />
);

export const PosterPlaceholder = ({
	className,
	children,
	...props
}: ViewProps) => {
	return (
		<View
			className={cn(
				"aspect-2/3 items-center justify-center overflow-hidden rounded bg-gray-300",
				className,
			)}
			{...props}
		>
			<KyooLogo style={{ width: "50%", aspectRatio: "289.35/296.15" }} />
			{children}
		</View>
	);
};
