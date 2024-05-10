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

import type { KyooImage } from "@kyoo/models";
import type { ReactElement } from "react";
import type { ImageStyle } from "react-native";
import type { YoshikiStyle } from "yoshiki/src/type";

export type YoshikiEnhanced<Style> = Style extends any
	? {
			[key in keyof Style]: YoshikiStyle<Style[key]>;
		}
	: never;

export type Props = {
	src?: KyooImage | null;
	quality: "low" | "medium" | "high";
	alt?: string;
	Err?: ReactElement | null;
	forcedLoading?: boolean;
};

export type ImageLayout = YoshikiEnhanced<
	| { width: ImageStyle["width"]; height: ImageStyle["height"] }
	| { width: ImageStyle["width"]; aspectRatio: ImageStyle["aspectRatio"] }
	| { height: ImageStyle["height"]; aspectRatio: ImageStyle["aspectRatio"] }
>;
