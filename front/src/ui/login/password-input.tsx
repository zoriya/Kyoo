import VisibilityOff from "@material-symbols/svg-400/rounded/visibility_off-fill.svg";
import Visibility from "@material-symbols/svg-400/rounded/visibility-fill.svg";
import { type ComponentProps, useState } from "react";
import { px, useYoshiki } from "yoshiki/native";
import { IconButton, Input } from "~/primitives";

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
