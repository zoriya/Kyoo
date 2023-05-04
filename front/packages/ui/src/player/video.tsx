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

declare module "react-native-video" {
	interface VideoProperties {
		fonts?: Font[];
		onPlayPause: (isPlaying: boolean) => void;
		onMediaUnsupported?: () => void;
	}
	export type VideoProps = Omit<VideoProperties, "source"> & {
		source: { uri: string; hls: string };
	};
}

export * from "react-native-video";

import { Font } from "@kyoo/models";
import { IconButton, Menu } from "@kyoo/primitives";
import { ComponentProps } from "react";
import Video from "react-native-video";
export default Video;

// TODO: Implement those for mobile.

type CustomMenu = ComponentProps<typeof Menu<ComponentProps<typeof IconButton>>>;
export const AudiosMenu = (props: CustomMenu) => {
	return <Menu {...props}></Menu>;
};

export const QualitiesMenu = (props: CustomMenu) => {
	return <Menu {...props}></Menu>;
};
