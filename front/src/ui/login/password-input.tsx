import VisibilityOff from "@material-symbols/svg-400/rounded/visibility_off-fill.svg";
import Visibility from "@material-symbols/svg-400/rounded/visibility-fill.svg";
import { type ComponentProps, useState } from "react";
import { IconButton, Input } from "~/primitives";

export const PasswordInput = (props: ComponentProps<typeof Input>) => {
	const [show, setVisibility] = useState(false);

	return (
		<Input
			secureTextEntry={!show}
			right={
				<IconButton
					icon={show ? VisibilityOff : Visibility}
					onPress={() => setVisibility(!show)}
				/>
			}
			{...props}
		/>
	);
};
