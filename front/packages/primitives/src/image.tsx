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
import { View, Image as Img, ImageSourcePropType, ImageStyle } from "react-native";
import { percent, useYoshiki } from "yoshiki/native";

type ImageOptions = {
	radius?: number;
	fallback?: string | ImageSourcePropType;
};

type ImageProps = {
	src?: string | ImageSourcePropType | null;
	alt?: string;
} & ImageOptions;

type ImagePropsWithLoading =
	| (ImageProps & { loading?: boolean })
	| (Partial<ImageProps> & { loading: true });

type Width = ImageStyle["width"];
type Height = ImageStyle["height"];

export const Image = ({
	src,
	alt,
	radius,
	fallback,
	loading = false,
	aspectRatio = undefined,
	width = undefined,
	height = undefined,
	...others
}: ImagePropsWithLoading &
	(
		| { aspectRatio?: number; width: Width; height: Height }
		| { aspectRatio: number; width?: Width; height?: Height }
	)) => {
	const { css } = useYoshiki();
	const [showLoading, setLoading] = useState<boolean>(loading);
	const [source, setSource] = useState(src);
	/* const imgRef = useRef<Img>(null); */

	// This allow the loading bool to be false with SSR but still be on client-side
	/* useLayoutEffect(() => { */
	/* 	if (!imgRef.current?.complete && src) setLoading(true); */
	/* 	if (!src && !loading) setLoading(false); */
	/* }, [src, loading]); */

	return (
		<View
			{...css(
				{
					aspectRatio,
					width,
					height,
					/* backgroundColor: "grey.300", */
					borderRadius: radius,
					overflow: "hidden",
					/* "& > *": { width: "100%", height: "100%" }, */
				},
				others,
			)}
		>
			{/* {showLoading && <Skeleton variant="rectangular" height="100%" />} */}
			{!loading && source && (
				<Img
					source={typeof source === "string" ? { uri: source } : source}
					accessibilityLabel={alt}
					onLoad={() => setLoading(false)}
					onError={() => {
						if (fallback) setSource(fallback);
						else setLoading(false);
					}}
					{...css({
						height: percent(100),
						width: percent(100),
						resizeMode: "cover",
						/* display: showLoading ? "hidden" : undefined, */
					})}
				/>
			)}
		</View>
	);
};

export const Poster = (props: ImagePropsWithLoading & { width?: Width; height?: Height }) => (
	<Image aspectRatio={2 / 3} {...props} />
);
