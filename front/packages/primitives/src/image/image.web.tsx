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
import { StyleList, processStyleList } from "yoshiki/src/type";
import { useYoshiki as useWebYoshiki } from "yoshiki/web";
import { useYoshiki } from "yoshiki/native";
import { Props, ImageLayout } from "./base-image";
import { blurHashToDataURL } from "./blurhash-web";
import { Skeleton } from "../skeleton";
import NextImage from "next/image";

// Extract classnames from leftover props using yoshiki's internal.
const extractClassNames = <Style,>(props: {
	style?: StyleList<{ $$css?: true; yoshiki?: string } | Style>;
}) => {
	const inline = processStyleList(props.style);
	return "$$css" in inline && inline.$$css ? inline.yoshiki : undefined;
};

export const Image = ({
	src,
	quality,
	alt,
	isLoading: forcedLoading = false,
	layout,
	Error,
	...props
}: Props & { style?: ImageStyle } & { layout: ImageLayout }) => {
	const { css } = useYoshiki();
	const { css: wCss } = useWebYoshiki();
	const [state, setState] = useState<"loading" | "errored" | "finished">(
		src ? "finished" : "errored",
	);

	useLayoutEffect(() => {
		setState("loading");
	}, []);

	const border = { borderRadius: 6 } satisfies ViewStyle;

	if (forcedLoading) return <Skeleton variant="custom" {...css([layout, border], props)} />;
	if (!src || state === "errored") {
		return Error !== undefined ? (
			Error
		) : (
			<View {...css([{ bg: (theme) => theme.overlay0 }, layout, border], props)} />
		);
	}

	const blurhash = blurHashToDataURL(src.blurhash);
	return (
		<div
			style={{
				// To reproduce view's behavior
				position: "relative",
				boxSizing: "border-box",
				overflow: "hidden",

				// Use a blurhash here to nicely fade the NextImage when it is loaded completly
				// (this prevents loading the image line by line which is ugly and buggy on firefox)
				backgroundImage: `url(${blurhash})`,
				backgroundSize: "cover",
				backgroundRepeat: "no-repeat",
				backgroundPosition: "50% 50%",
			}}
			{...wCss([layout as any, { ...border, borderRadius: "6px" }], {
				// Gather classnames from props (to support parent's hover for example).
				className: extractClassNames(props),
			})}
		>
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
				blurDataURL={blurhash}
				placeholder="blur"
				// Don't use next's server to reprocess images, they are already optimized by kyoo.
				unoptimized={true}
				onLoadingComplete={() => setState("finished")}
				onError={() => setState("errored")}
			/>
		</div>
	);
};
