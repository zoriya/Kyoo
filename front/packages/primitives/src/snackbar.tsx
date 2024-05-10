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

import { usePortal } from "@gorhom/portal";
import { type ReactElement, createContext, useCallback, useContext, useRef } from "react";
import { ContrastArea, SwitchVariant } from "./themes";
import { P } from "./text";
import { View } from "react-native";
import { percent, px } from "yoshiki/native";
import { ts } from "./utils";
import { Button } from "./button";
import { imageBorderRadius } from "./constants";

export type Snackbar = {
	key?: string;
	label: string;
	duration: number;
	actions?: Action[];
};

export type Action = {
	label: string;
	icon: ReactElement;
	action: () => void;
};

const SnackbarContext = createContext<(snackbar: Snackbar) => void>(null!);

export const SnackbarProvider = ({ children }: { children: ReactElement | ReactElement[] }) => {
	const { addPortal, removePortal } = usePortal();
	const snackbars = useRef<Snackbar[]>([]);
	const timeout = useRef<NodeJS.Timeout | null>(null);

	const createSnackbar = useCallback(
		(snackbar: Snackbar) => {
			if (snackbar.key) snackbars.current = snackbars.current.filter((x) => snackbar.key !== x.key);
			snackbars.current.unshift(snackbar);

			if (timeout.current) return;
			const updatePortal = () => {
				const top = snackbars.current.pop();
				if (!top) {
					timeout.current = null;
					return;
				}

				addPortal("snackbar", <Snackbar {...top} />);
				timeout.current = setTimeout(() => {
					removePortal("snackbar");
					updatePortal();
				}, snackbar.duration * 1000);
			};
			updatePortal();
		},
		[addPortal, removePortal],
	);

	return <SnackbarContext.Provider value={createSnackbar}>{children}</SnackbarContext.Provider>;
};

export const useSnackbar = () => {
	return useContext(SnackbarContext);
};

const Snackbar = ({ label, actions }: Snackbar) => {
	// TODO: take navbar height into account for setting the position of the snacbar.
	return (
		<SwitchVariant>
			{({ css }) => (
				<View
					{...css({
						position: "absolute",
						left: 0,
						right: 0,
						bottom: ts(4),
					})}
				>
					<View
						{...css({
							bg: (theme) => theme.background,
							maxWidth: { sm: percent(75), md: percent(45), lg: px(500) },
							margin: ts(1),
							padding: ts(1),
							flexDirection: "row",
							borderRadius: imageBorderRadius,
						})}
					>
						<P {...css({ flexGrow: 1, flexShrink: 1 })}>{label}</P>
						{actions?.map((x, i) => (
							<Button key={i} text={x.label} icon={x.icon} onPress={x.action} />
						))}
					</View>
				</View>
			)}
		</SwitchVariant>
	);
};
