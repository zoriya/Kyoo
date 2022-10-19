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

import { Box, Skeleton, SxProps } from "@mui/material";
import { SyntheticEvent, useLayoutEffect, useRef, useState } from "react";
import { ComponentsOverrides, ComponentsProps, ComponentsVariants } from "@mui/material";
import { withThemeProps } from "~/utils/with-theme";
import type { Property } from "csstype";
import { ResponsiveStyleValue } from "@mui/system";

type ImageOptions = {
	radius?: string;
	fallback?: string;
};

type ImageProps = {
	img?: string | null;
	alt?: string;
} & ImageOptions;

type ImagePropsWithLoading =
	| (ImageProps & { loading?: boolean })
	| (Partial<ImageProps> & { loading: true });

type Width = ResponsiveStyleValue<Property.Width<(string & {}) | 0>>;
type Height = ResponsiveStyleValue<Property.Height<(string & {}) | 0>>;

export const Image = ({
	img,
	alt,
	radius,
	fallback,
	loading = false,
	aspectRatio = undefined,
	width = undefined,
	height = undefined,
	sx,
	...others
}: ImagePropsWithLoading & { sx?: SxProps } & (
		| { aspectRatio?: string; width: Width; height: Height }
		| { aspectRatio: string; width?: Width; height?: Height }
	)) => {
	const [showLoading, setLoading] = useState<boolean>(loading);
	const imgRef = useRef<HTMLImageElement>(null);

	// This allow the loading bool to be false with SSR but still be on client-side
	useLayoutEffect(() => {
		if (!imgRef.current?.complete && img) setLoading(true);
		if (!img && !loading) setLoading(false);
	}, [img, loading]);

	return (
		<Box
			borderRadius={radius}
			overflow={"hidden"}
			sx={{
				aspectRatio,
				width,
				height,
				backgroundColor: "grey.300",
				"& > *": { width: "100%", height: "100%" },
				...sx,
			}}
			{...others}
		>
			{showLoading && <Skeleton variant="rectangular" height="100%" />}
			{!loading && img && (
				<Box
					component="img"
					ref={imgRef}
					src={img}
					alt={alt}
					onLoad={() => setLoading(false)}
					onError={({ currentTarget }: SyntheticEvent<HTMLImageElement>) => {
						if (fallback && currentTarget.src !== fallback) currentTarget.src = fallback;
						else setLoading(false);
					}}
					sx={{ objectFit: "cover", display: showLoading ? "hidden" : undefined }}
				/>
			)}
		</Box>
	);
};

const _Poster = (props: ImagePropsWithLoading & { width?: Width; height?: Height }) => (
	// eslint-disable-next-line jsx-a11y/alt-text
	<Image aspectRatio="2 / 3" {...props} />
);

declare module "@mui/material/styles" {
	interface ComponentsPropsList {
		Poster: ImageOptions;
	}

	interface ComponentNameToClassKey {
		Poster: Record<string, never>;
	}

	interface Components<Theme = unknown> {
		Poster?: {
			defaultProps?: ComponentsProps["Poster"];
			styleOverrides?: ComponentsOverrides<Theme>["Poster"];
			variants?: ComponentsVariants["Poster"];
		};
	}
}

export const Poster = withThemeProps(_Poster, {
	name: "Poster",
	slot: "Root",
});
