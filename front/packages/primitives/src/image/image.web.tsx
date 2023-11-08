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

import { useLayoutEffect, useState } from "react";
import { ImageStyle, View, ViewStyle } from "react-native";
import { useYoshiki } from "yoshiki/native";
import { Props, ImageLayout } from "./base-image";
import { BlurhashContainer, blurHashToDataURL } from "./blurhash.web";
import { Skeleton } from "../skeleton";
import NextImage from "next/image";

export const Image = ({
	src,
	quality,
	alt,
	forcedLoading = false,
	layout,
	Error,
	...props
}: Props & { style?: ImageStyle } & { layout: ImageLayout }) => {
	const { css } = useYoshiki();
	const [state, setState] = useState<"loading" | "errored" | "finished">(
		src ? (typeof window === "undefined" ? "finished" : "loading") : "errored",
	);

	const border = { borderRadius: 6 } satisfies ViewStyle;

	if (forcedLoading) return <Skeleton variant="custom" {...css([layout, border], props)} />;
	if (!src || state === "errored") {
		return Error !== undefined ? (
			Error
		) : (
			<View {...css([{ bg: (theme) => theme.overlay0 }, layout, border], props)} />
		);
	}

	return (
		<BlurhashContainer blurhash={src.blurhash} {...css([layout, border], props)}>
			<NextImage
				src={src[quality ?? "high"]}
				priority={quality === "high"}
				alt={alt!}
				fill={true}
				style={{
					objectFit: "cover",
					opacity: state === "loading" ? 0 : 1,
					transition: "opacity .2s ease-out",
				}}
				// Don't use next's server to reprocess images, they are already optimized by kyoo.
				unoptimized={true}
				onLoad={() => setState("finished")}
				onError={() => setState("errored")}
				suppressHydrationWarning
			/>
		</BlurhashContainer>
	);
};
