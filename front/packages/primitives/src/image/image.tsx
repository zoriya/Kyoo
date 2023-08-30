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
import { ImageProps, ImageStyle, Platform, View, ViewStyle } from "react-native";
import { useYoshiki } from "yoshiki/native";
import { YoshikiEnhanced, WithLoading, Props, ImageLayout } from "./base-image";
import { Skeleton } from "../skeleton";

export const Image = ({
	src,
	quality,
	alt,
	isLoading: forcedLoading = false,
	layout,
	...props
}: Props & { style?: ImageStyle } & { layout: ImageLayout }) => {
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

	const border = { borderRadius: 6 } satisfies ViewStyle;

	if (forcedLoading) return <Skeleton variant="custom" {...css([layout, border], props)} />;
	if (!src || state === "errored")
		return <View {...css([{ bg: (theme) => theme.overlay0 }, layout, border], props)} />;

	const nativeProps = Platform.select<Partial<ImageProps>>({
		web: {
			defaultSource: typeof src === "string" ? { uri: src } : Array.isArray(src) ? src[0] : src,
		},
		default: {},
	});

	return (
		<View {...css(layout)}>
			<Blurhash src={src.high} blurhash={src.blurhash} />
		</View>
	);

	// return (
	// 	<Skeleton variant="custom" show={state === "loading"} {...css([layout, border], props)}>
	// 		<Img
	// 			source={{ uri: src[quality || "high"] }}
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
