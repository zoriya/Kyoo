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

import { IconButton, Input } from "@kyoo/primitives";
import { type ComponentProps, useState } from "react";
import { px, useYoshiki } from "yoshiki/native";
import Visibility from "@material-symbols/svg-400/rounded/visibility-fill.svg";
import VisibilityOff from "@material-symbols/svg-400/rounded/visibility_off-fill.svg";

export const PasswordInput = (props: ComponentProps<typeof Input>) => {
	const { css } = useYoshiki();
	const [show, setVisibility] = useState(false);

	return (
		<Input
			secureTextEntry={!show}
			right={
				<IconButton
					icon={show ? VisibilityOff : Visibility}
					size={19}
					onPress={() => setVisibility(!show)}
					{...css({ width: px(19), height: px(19), m: 0, p: 0 })}
				/>
			}
			{...props}
		/>
	);
};
