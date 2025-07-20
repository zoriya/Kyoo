import ExpandMore from "@material-symbols/svg-400/rounded/keyboard_arrow_down-fill.svg";
import { Button } from "./button";
import { Icon } from "./icons";
import { Menu } from "./menu";

export const Select = <Value extends string>({
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
		<Menu
			Trigger={Button}
			text={getLabel(value)}
			icon={<Icon icon={ExpandMore} />}
		>
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
