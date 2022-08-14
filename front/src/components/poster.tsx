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

import { Box, Skeleton, styled } from "@mui/material";
import {
	SyntheticEvent,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { ComponentsOverrides, ComponentsProps, ComponentsVariants } from "@mui/material";
import { withThemeProps } from "~/utils/with-theme";

type ImageOptions = {
	radius?: string;
	fallback?: string;
};

type ImageProps = {
	img?: string;
	alt: string;
} & ImageOptions;

type ImagePropsWithLoading =
	| (ImageProps & { loading?: false })
	| (Partial<ImageProps> & { loading: true });

const _Image = ({
	img,
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
		| { aspectRatio?: string; width: string | number; height: string | number }
		| { aspectRatio: string; width?: string | number; height?: string | number }
	)) => {
	const [showLoading, setLoading] = useState<boolean>(loading);
	const imgRef = useRef<HTMLImageElement>(null);

	// This allow the loading bool to be false with SSR but still be on client-side
	useLayoutEffect(() => {
		if (!imgRef.current?.complete) setLoading(true);
	}, []);

	return (
		<Box
			borderRadius={radius}
			overflow={"hidden"}
			sx={{
				aspectRatio,
				width,
				height,
				backgroundColor: "primary.dark",
				"& > *": { width: "100%", height: "100%" },
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

export const Image = styled(_Image)({});

// eslint-disable-next-line jsx-a11y/alt-text
const _Poster = (props: ImagePropsWithLoading) => <_Image aspectRatio="2 / 3" {...props} />;

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
