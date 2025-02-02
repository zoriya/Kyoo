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

import NextImage from "next/image";
import { type ReactElement, useState } from "react";
import { type ImageStyle, View, type ViewStyle } from "react-native";
import { useYoshiki } from "yoshiki/native";
import { imageBorderRadius } from "../constants";
import { Skeleton } from "../skeleton";
import type { ImageLayout, Props } from "./base-image";
import { BlurhashContainer, useRenderType } from "./blurhash.web";

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
		typeof window === "undefined" ? "finished" : "loading",
	);

	const border = { borderRadius: imageBorderRadius } satisfies ViewStyle;

	if (forcedLoading) return <Skeleton variant="custom" {...css([layout, border], props)} />;
	if (!src || state === "errored") {
		return Err !== undefined ? (
			Err
		) : (
			<View {...css([{ bg: (theme) => theme.overlay0 }, layout, border], props)} />
		);
	}

	return (
		<BlurhashContainer blurhash={src.blurhash} {...css([layout, border], props)}>
			<img
				style={{
					position: "absolute",
					inset: 0,
					width: "100%",
					height: "100%",
					color: "transparent",
					objectFit: "cover",
					opacity: state === "loading" ? 0 : 1,
					transition: "opacity .2s ease-out",
				}}
				// It's intended to keep `loading` before `src` because React updates
				// props in order which causes Safari/Firefox to not lazy load properly.
				// See https://github.com/facebook/react/issues/25883
				loading={quality === "high" ? "eager" : "lazy"}
				decoding="async"
				fetchpriority={quality === "high" ? "high" : undefined}
				src={src[quality ?? "high"]}
				alt={alt!}
				onLoad={() => setState("finished")}
				onError={() => setState("errored")}
				suppressHydrationWarning
			/>
		</BlurhashContainer>
	);
};

Image.Loader = ({ layout, ...props }: { layout: ImageLayout; children?: ReactElement }) => {
	const { css } = useYoshiki();
	const border = { borderRadius: 6, overflow: "hidden" } satisfies ViewStyle;

	return <Skeleton variant="custom" show {...css([layout, border], props)} />;
};
