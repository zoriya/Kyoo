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

import { KyooErrors, useAccount } from "@kyoo/models";
import { P } from "@kyoo/primitives";
import { ReactElement, createContext, useContext, useEffect, useLayoutEffect, useState } from "react";
import { View } from "react-native";
import { useYoshiki } from "yoshiki/native";
import { PermissionError } from "./unauthorized";

export const ErrorView = ({
	error,
	noBubble = false,
}: {
	error: KyooErrors;
	noBubble?: boolean;
}) => {
	const { css } = useYoshiki();
	const setError = useErrorContext();

	useLayoutEffect(() => {
		// if this is a permission error, make it go up the tree to have a whole page login screen.
		if (!noBubble && (error.status === 401 || error.status == 403)) setError(error);
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

const ErrorCtx = createContext<(val: KyooErrors | null) => void>(null!);

export const ErrorContext = ({ children }: { children: ReactElement }) => {
	const [error, setError] = useState<KyooErrors | null>(null);
	const account = useAccount();

	useEffect(() => {
		setError(null);
	}, [account, children]);

	if (error && (error.status === 401 || error.status === 403))
		return <PermissionError error={error} />;
	if (error) return <ErrorView error={error} noBubble />;
	return <ErrorCtx.Provider value={setError}>{children}</ErrorCtx.Provider>;
};
export const useErrorContext = () => {
	return useContext(ErrorCtx);
};
