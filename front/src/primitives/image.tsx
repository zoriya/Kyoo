import { Image as EImage } from "expo-image";
import type { ComponentProps } from "react";
import { type ImageStyle, Platform, type ViewStyle } from "react-native";
import { useYoshiki } from "yoshiki/native";
import type { YoshikiStyle } from "yoshiki/src/type";
import type { KImage } from "~/models";
import { useToken } from "~/providers/account-context";
import { Skeleton } from "./skeleton";

export type YoshikiEnhanced<Style> = Style extends any
	? {
			[key in keyof Style]: YoshikiStyle<Style[key]>;
		}
	: never;

export type ImageLayout = YoshikiEnhanced<
	| { width: ImageStyle["width"]; height: ImageStyle["height"] }
	| { width: ImageStyle["width"]; aspectRatio: ImageStyle["aspectRatio"] }
	| { height: ImageStyle["height"]; aspectRatio: ImageStyle["aspectRatio"] }
>;

// This should stay in think with `ImageBackground`.
// (copy-pasted but change `EImageBackground` with `EImage`)
export const Image = ({
	src,
	quality,
	alt,
	layout,
	...props
}: {
	src: KImage | null;
	quality: "low" | "medium" | "high";
	alt?: string;
	style?: ImageStyle;
	layout: ImageLayout;
}) => {
	const { css, theme } = useYoshiki();
	const { apiUrl, authToken } = useToken();

	return (
		<EImage
			source={{
				uri: src ? `${apiUrl}${src[quality ?? "high"]}` : null,
				// use cookies on web to allow `img` to make the call instead of js
				headers:
					authToken && Platform.OS !== "web"
						? {
								Authorization: authToken,
							}
						: undefined,
			}}
			placeholder={{ blurhash: src?.blurhash }}
			accessibilityLabel={alt}
			{...(css(
				[layout, { borderRadius: 6, backgroundColor: theme.overlay0 }],
				props,
			) as any)}
		/>
	);
};

Image.Loader = ({ layout, ...props }: { layout: ImageLayout }) => {
	const { css } = useYoshiki();
	const border = { borderRadius: 6 } satisfies ViewStyle;

	return <Skeleton variant="custom" {...css([layout, border], props)} />;
};

export const Poster = ({
	layout,
	...props
}: Omit<ComponentProps<typeof Image>, "layout"> & {
	layout: YoshikiEnhanced<
		{ width: ImageStyle["width"] } | { height: ImageStyle["height"] }
	>;
}) => <Image layout={{ aspectRatio: 2 / 3, ...layout }} {...props} />;

Poster.Loader = ({
	layout,
	...props
}: {
	layout: YoshikiEnhanced<
		{ width: ImageStyle["width"] } | { height: ImageStyle["height"] }
	>;
}) => <Image.Loader layout={{ aspectRatio: 2 / 3, ...layout }} {...props} />;
