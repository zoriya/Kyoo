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

import ExpandMore from "@material-symbols/svg-400/rounded/keyboard_arrow_down-fill.svg";
import { Button } from "./button";
import { Icon } from "./icons";
import { Menu } from "./menu";

export const Select = <Value extends string>({
	label,
	value,
	onValueChange,
	values,
	getLabel,
}: {
	label: string;
	value: Value;
	onValueChange: (v: Value) => void;
	values: Value[];
	getLabel: (key: Value) => string;
}) => {
	return (
		<Menu Trigger={Button} text={getLabel(value)} icon={<Icon icon={ExpandMore} />}>
			{values.map((x) => (
				<Menu.Item
					key={x}
					label={getLabel(x)}
					selected={x === value}
					onSelect={() => onValueChange(x)}
				/>
			))}
		</Menu>
	);
};
