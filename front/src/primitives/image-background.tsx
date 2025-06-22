import { ImageBackground as EImageBackground } from "expo-image";
import { LinearGradient, type LinearGradientProps } from "expo-linear-gradient";
import type { ComponentProps, ReactNode } from "react";
import type { ImageStyle } from "react-native";
import { useYoshiki } from "yoshiki/native";
import type { KImage } from "~/models";
import { useToken } from "~/providers/account-context";
import type { ImageLayout, YoshikiEnhanced } from "./image";

// This should stay in think with `Image`.
// (copy-pasted but change `EImage` with `EImageBackground`)
// ALSO, remove `border-radius` (it's weird otherwise)
export const ImageBackground = ({
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
	children: ReactNode;
}) => {
	const { css } = useYoshiki();
	const { apiUrl, authToken } = useToken();

	return (
		<EImageBackground
			source={{
				uri: src ? `${apiUrl}${src[quality ?? "high"]}` : null,
				headers: authToken
					? {
							Authorization: authToken,
						}
					: {},
			}}
			placeholder={{ blurhash: src?.blurhash }}
			accessibilityLabel={alt}
			{...(css(layout, props) as any)}
		/>
	);
};
export const PosterBackground = ({
	alt,
	layout,
	...props
}: Omit<ComponentProps<typeof ImageBackground>, "layout"> & {
	style?: ImageStyle;
	layout: YoshikiEnhanced<{ width: ImageStyle["width"] } | { height: ImageStyle["height"] }>;
}) => {
	const { css } = useYoshiki();

	return (
		<ImageBackground
			alt={alt!}
			layout={{ aspectRatio: 2 / 3, ...layout }}
			{...css({ borderRadius: 6 }, props)}
		/>
	);
};

export const GradientImageBackground = ({
	gradient,
	children,
	...props
}: ComponentProps<typeof ImageBackground> & {
	gradient?: Partial<LinearGradientProps>;
}) => {
	const { css, theme } = useYoshiki();

	return (
		<ImageBackground {...props}>
			<LinearGradient
				start={{ x: 0, y: 0.25 }}
				end={{ x: 0, y: 1 }}
				colors={["transparent", theme.darkOverlay]}
				{...css(
					{
						position: "absolute",
						top: 0,
						bottom: 0,
						left: 0,
						right: 0,
					},
					typeof gradient === "object" ? gradient : undefined,
				)}
			>
				{children}
			</LinearGradient>
		</ImageBackground>
	);
};
