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

import { useState } from "react";
import {
	View,
	Image as Img,
	ImageSourcePropType,
	ImageStyle,
	Platform,
	ImageProps,
} from "react-native";
import { useYoshiki } from "yoshiki/native";
import { YoshikiStyle } from "yoshiki/dist/type";
import { Skeleton } from "./skeleton";

type YoshikiEnhanced<Style> = Style extends any
	? {
			[key in keyof Style]: YoshikiStyle<Style[key]>;
	  }
	: never;

type WithLoading<T> = (T & { isLoading?: boolean }) | (Partial<T> & { isLoading: true });

type Props = WithLoading<{
	src?: string | ImageSourcePropType | null;
	alt?: string;
	fallback?: string | ImageSourcePropType;
}>;

export const Image = ({
	src,
	alt,
	isLoading: forcedLoading = false,
	layout,
	...props
}: Props & { style?: ImageStyle } & {
	layout: YoshikiEnhanced<
		| { width: ImageStyle["width"]; height: ImageStyle["height"] }
		| { width: ImageStyle["width"]; aspectRatio: ImageStyle["aspectRatio"] }
		| { height: ImageStyle["height"]; aspectRatio: ImageStyle["aspectRatio"] }
	>;
}) => {
	const { css } = useYoshiki();
	const [state, setState] = useState<"loading" | "errored" | "finished">(
		src ? "loading" : "errored",
	);

	// This could be done with a key but this makes the API easier to use.
	// This unsures that the state is resetted when the source change (useful for recycler lists.)
	const [oldSource, setOldSource] = useState(src);
	if (oldSource !== src) {
		setState("loading");
		setOldSource(src);
	}

	const border = { borderRadius: 6 } satisfies ImageStyle;

	if (forcedLoading) return <Skeleton variant="custom" {...css([layout, border])} />;
	if (!src || state === "errored")
		return <View {...css([{ bg: (theme) => theme.overlay0 }, layout, border])} />;

	const nativeProps = Platform.select<ImageProps>({
		web: {
			defaultSource: typeof src === "string" ? { uri: src } : Array.isArray(src) ? src[0] : src,
		},
		default: {},
	});

	return (
		<Skeleton variant="custom" show={state === "loading"} {...css([layout, border])}>
			<Img
				source={typeof src === "string" ? { uri: src } : src}
				accessibilityLabel={alt}
				onLoad={() => setState("finished")}
				onError={() => setState("errored")}
				{...nativeProps}
				{...css(
					[
						{
							resizeMode: "cover",
						},
						layout,
					],
					props,
				)}
			/>
		</Skeleton>
	);
};

export const Poster = ({
	alt,
	isLoading = false,
	layout,
	...props
}: Props & { style?: ImageStyle } & {
	layout: YoshikiEnhanced<{ width: ImageStyle["width"] } | { height: ImageStyle["height"] }>;
}) => (
	<Image isLoading={isLoading} alt={alt} layout={{ aspectRatio: 2 / 3, ...layout }} {...props} />
);
