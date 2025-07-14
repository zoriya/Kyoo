import { View } from "react-native";
import { useYoshiki } from "yoshiki/native";
import type { KyooError } from "~/models";
import { P } from "~/primitives";

export const ErrorView = ({ error }: { error: KyooError }) => {
	const { css } = useYoshiki();

	return (
		<View
			{...css({
				backgroundColor: (theme) => theme.colors.red,
				flexGrow: 1,
				flexShrink: 1,
				justifyContent: "center",
				alignItems: "center",
			})}
		>
			<P {...css({ color: (theme) => theme.colors.white })}>{error.message}</P>
		</View>
	);
};
