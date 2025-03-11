import { View } from "react-native";
import { useYoshiki } from "yoshiki/native";
import { P } from "~/primitives";

export const EmptyView = ({ message }: { message: string }) => {
	const { css } = useYoshiki();

	return (
		<View
			{...css({
				flexGrow: 1,
				justifyContent: "center",
				alignItems: "center",
			})}
		>
			<P {...css({ color: (theme) => theme.heading })}>{message}</P>
		</View>
	);
};
