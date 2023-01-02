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

import { TextInput } from "react-native";
import { px, Stylable, useYoshiki } from "yoshiki/native";
import { ts } from "./utils";

export const Input = ({
	onChange,
	value,
	placeholder,
	placeholderTextColor,
	...props
}: {
	onChange: (value: string) => void;
	value?: string;
	placeholder?: string;
	placeholderTextColor?: string;
} & Stylable) => {
	const { css, theme } = useYoshiki();

	return (
		<TextInput
			value={value ?? ""}
			onChangeText={onChange}
			placeholder={placeholder}
			placeholderTextColor={placeholderTextColor ?? theme.overlay1}
			{...css(
				{
					borderColor: (theme) => theme.accent,
					borderRadius: ts(1),
					borderWidth: px(1),
					padding: ts(0.5),
				},
				props,
			)}
		/>
	);
};
