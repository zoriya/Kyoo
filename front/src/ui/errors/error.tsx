import { useContext, useLayoutEffect } from "react";
import { View } from "react-native";
import { useYoshiki } from "yoshiki/native";
import { ConnectionErrorContext, type KyooErrors } from "~/models";
import { P } from "~/primitives";

export const ErrorView = ({
	error,
	noBubble = false,
}: {
	error: KyooErrors;
	noBubble?: boolean;
}) => {
	const { css } = useYoshiki();
	const { setError } = useContext(ConnectionErrorContext);

	useLayoutEffect(() => {
		// if this is a permission error, make it go up the tree to have a whole page login screen.
		if (!noBubble && (error.status === 401 || error.status === 403)) setError(error);
	}, [error, noBubble, setError]);
	console.log(error);
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
			{error.errors.map((x, i) => (
				<P key={i} {...css({ color: (theme) => theme.colors.white })}>
					{x}
				</P>
			))}
		</View>
	);
};
