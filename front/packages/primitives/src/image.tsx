/*
 * Kyoo - A portable and vast media library solution.
 * Copyright (c) Kyoo.
 *
 * See AUTHORS.md and LICENSE file in the project root for full license information.
 *
 * Kyoo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * Kyoo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Kyoo. If not, see <https://www.gnu.org/licenses/>.
 */

import { KyooImage } from "@kyoo/models";
import { ComponentType, ReactNode, useState } from "react";
import {
	View,
	ImageSourcePropType,
	ImageStyle,
	Platform,
	ImageProps,
	ViewProps,
	ViewStyle,
} from "react-native";
import {Image as Img} from "expo-image"
import { percent, useYoshiki } from "yoshiki/native";
import { YoshikiStyle } from "yoshiki/dist/type";
import { Skeleton } from "./skeleton";
import { LinearGradient, LinearGradientProps } from "expo-linear-gradient";
import { alpha, ContrastArea } from "./themes";

type YoshikiEnhanced<Style> = Style extends any
	? {
			[key in keyof Style]: YoshikiStyle<Style[key]>;
	  }
	: never;

type WithLoading<T> = (T & { isLoading?: boolean }) | (Partial<T> & { isLoading: true });

type Props = WithLoading<{
	src?: KyooImage | null;
	alt?: string;
}>;

type ImageLayout = YoshikiEnhanced<
	| { width: ImageStyle["width"]; height: ImageStyle["height"] }
	| { width: ImageStyle["width"]; aspectRatio: ImageStyle["aspectRatio"] }
	| { height: ImageStyle["height"]; aspectRatio: ImageStyle["aspectRatio"] }
>;

export const Image = ({
	src,
	alt,
	isLoading: forcedLoading = false,
	layout,
	...props
}: Props & { style?: ViewStyle } & { layout: ImageLayout }) => {
	const { css } = useYoshiki();
	console.log(src);

	return (
		<Img
			source={src?.source}
			placeholder={src?.blurhash}
			accessibilityLabel={alt}
			{...css([
				layout,
			// 	{
			// 		// width: percent(100),
			// 		// height: percent(100),
			// 		// resizeMode: "cover",
			// 		borderRadius: 6
			// 	},
			]) as ImageStyle}
		/>
	);
	// const [state, setState] = useState<"loading" | "errored" | "finished">(
	// 	src ? "loading" : "errored",
	// );
	//
	// // This could be done with a key but this makes the API easier to use.
	// // This unsures that the state is resetted when the source change (useful for recycler lists.)
	// const [oldSource, setOldSource] = useState(src);
	// if (oldSource !== src) {
	// 	setState("loading");
	// 	setOldSource(src);
	// }
	//
	// const border = { borderRadius: 6 } satisfies ViewStyle;
	//
	// if (forcedLoading) return <Skeleton variant="custom" {...css([layout, border], props)} />;
	// if (!src || state === "errored")
	// 	return <View {...css([{ bg: (theme) => theme.overlay0 }, layout, border], props)} />;
	//
	// const nativeProps = Platform.select<Partial<ImageProps>>({
	// 	web: {
	// 		defaultSource: typeof src === "string" ? { uri: src } : Array.isArray(src) ? src[0] : src,
	// 	},
	// 	default: {},
	// });
	//
	// return (
	// 	<Skeleton variant="custom" show={state === "loading"} {...css([layout, border], props)}>
	// 		<Img
	// 			source={typeof src === "string" ? { uri: src } : src}
	// 			accessibilityLabel={alt}
	// 			onLoad={() => setState("finished")}
	// 			onError={() => setState("errored")}
	// 			{...nativeProps}
	// 			{...css([
	// 				{
	// 					width: percent(100),
	// 					height: percent(100),
	// 					resizeMode: "cover",
	// 				},
	// 			])}
	// 		/>
	// 	</Skeleton>
	// );
};

export const Poster = ({
	alt,
	isLoading = false,
	layout,
	...props
}: Props & { style?: ViewStyle } & {
	layout: YoshikiEnhanced<{ width: ViewStyle["width"] } | { height: ViewStyle["height"] }>;
}) => (
	<Image isLoading={isLoading} alt={alt} layout={{ aspectRatio: 2 / 3, ...layout }} {...props} />
);

export const ImageBackground = <AsProps = ViewProps,>({
	src,
	alt,
	gradient = true,
	as,
	children,
	containerStyle,
	imageStyle,
	isLoading,
	...asProps
}: {
	as?: ComponentType<AsProps>;
	gradient?: Partial<LinearGradientProps> | boolean;
	children: ReactNode;
	containerStyle?: YoshikiEnhanced<ViewStyle>;
	imageStyle?: YoshikiEnhanced<ImageStyle>;
} & AsProps &
	Props) => {
	const [isErrored, setErrored] = useState(false);

	const nativeProps = Platform.select<Partial<ImageProps>>({
		web: {
			defaultSource: typeof src === "string" ? { uri: src! } : Array.isArray(src) ? src[0] : src!,
		},
		default: {},
	});
	const Container = as ?? View;
	return (
		<ContrastArea contrastText>
			{({ css, theme }) => (
				<Container {...(asProps as AsProps)}>
					<View
						{...css([
							{
								position: "absolute",
								top: 0,
								bottom: 0,
								left: 0,
								right: 0,
								zIndex: -1,
								bg: (theme) => theme.background,
							},
							containerStyle,
						])}
					>
						{src && !isErrored && (
							<Img
								source={typeof src === "string" ? { uri: src } : src}
								accessibilityLabel={alt}
								onError={() => setErrored(true)}
								{...nativeProps}
								{...css([
									{ width: percent(100), height: percent(100), resizeMode: "cover" },
									imageStyle,
								])}
							/>
						)}
						{gradient && (
							<LinearGradient
								start={{ x: 0, y: 0.25 }}
								end={{ x: 0, y: 1 }}
								colors={["transparent", alpha(theme.colors.black, 0.6)]}
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
							/>
						)}
					</View>
					{children}
				</Container>
			)}
		</ContrastArea>
	);
};
