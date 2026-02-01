import { ImageBackground as EImageBackground } from "expo-image";
import { LinearGradient, type LinearGradientProps } from "expo-linear-gradient";
import type { ComponentProps, ReactNode } from "react";
import type { ImageStyle } from "react-native";
import { Platform } from "react-native";
import { withUniwind } from "uniwind";
import { useYoshiki } from "yoshiki/native";
import type { KImage } from "~/models";
import { useToken } from "~/providers/account-context";
import { cn } from "~/utils";

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
			imageStyle={{ width: "100%", height: "100%", margin: 0, padding: 0 }}
			{...props}
		/>
	);
};
export const PosterBackground = ({
	alt,
	className,
	...props
}: ComponentProps<typeof ImageBackground>) => {
	return (
		<ImageBackground
			alt={alt!}
			className={cn("aspect-2/3 overflow-hidden rounded", className)}
			{...props}
		/>
	);
};

export const GradientImageBackground = ({
	gradient,
	gradientStyle,
	children,
	...props
}: ComponentProps<typeof ImageBackground> & {
	gradient?: Partial<LinearGradientProps>;
	gradientStyle?: Parameters<ReturnType<typeof useYoshiki>["css"]>[0];
}) => {
	const { css, theme } = useYoshiki();

	return (
		<ImageBackground {...props}>
			<LinearGradient
				start={{ x: 0, y: 0.25 }}
				end={{ x: 0, y: 1 }}
				colors={["transparent", theme.darkOverlay]}
				{...css(
					[
						{
							position: "absolute",
							top: 0,
							bottom: 0,
							left: 0,
							right: 0,
						},
						gradientStyle,
					],
					typeof gradient === "object" ? gradient : undefined,
				)}
			>
				{children}
			</LinearGradient>
		</ImageBackground>
	);
};
