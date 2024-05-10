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
import { FlexStyle, ImageStyle, View, ViewStyle } from "react-native";
import FastImage from "react-native-fast-image";
import { Blurhash } from "react-native-blurhash";
import { percent, useYoshiki } from "yoshiki/native";
import { Props, ImageLayout } from "./base-image";
import { Skeleton } from "../skeleton";
import { getCurrentToken } from "@kyoo/models";

export const Image = ({
	src,
	quality,
	alt,
	forcedLoading = false,
	layout,
	Err,
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

	const border = { borderRadius: 6, overflow: "hidden" } satisfies ViewStyle;

	if (forcedLoading) return <Skeleton variant="custom" {...css([layout, border], props)} />;
	if (!src || state === "errored") {
		return Err !== undefined ? (
			Err
		) : (
			<View {...css([{ bg: (theme) => theme.overlay0 }, layout, border], props)} />
		);
	}

	quality ??= "high";
	const token = getCurrentToken();
	return (
		<View {...css([layout, border], props)}>
			{state !== "finished" && (
				<Blurhash
					blurhash={src.blurhash}
					resizeMode="cover"
					{...css({ width: percent(100), height: percent(100) })}
				/>
			)}
			<FastImage
				source={{
					uri: src[quality],
					headers: token
						? {
								Authorization: token,
							}
						: {},
					priority: FastImage.priority[quality === "medium" ? "normal" : quality],
				}}
				accessibilityLabel={alt}
				onLoad={() => setState("finished")}
				onError={() => setState("errored")}
				resizeMode={FastImage.resizeMode.cover}
				{...(css({
					width: percent(100),
					height: percent(100),
				}) as { style: FlexStyle })}
			/>
		</View>
	);
};
