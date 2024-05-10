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

import { useWindowDimensions } from "react-native";
import { type Breakpoints as YoshikiBreakpoint, isBreakpoints, breakpoints } from "yoshiki/native";

type AtLeastOne<T, U = { [K in keyof T]: Pick<T, K> }> = Partial<T> & U[keyof U];
export type Breakpoint<T> = T | AtLeastOne<YoshikiBreakpoint<T>>;

// copied from yoshiki.
const useBreakpoint = () => {
	const { width } = useWindowDimensions();
	const idx = Object.values(breakpoints).findIndex((x) => width <= x);
	if (idx === -1) return 0;
	return idx - 1;
};

const getBreakpointValue = <T>(value: Breakpoint<T>, breakpoint: number): T => {
	if (!isBreakpoints(value)) return value;
	const bpKeys = Object.keys(breakpoints) as Array<keyof YoshikiBreakpoint<T>>;
	for (let i = breakpoint; i >= 0; i--) {
		if (bpKeys[i] in value) {
			const val = value[bpKeys[i]];
			if (val) return val;
		}
	}
	// This should never be reached.
	return undefined!;
};

export const useBreakpointValue = <T>(value: Breakpoint<T>): T => {
	const breakpoint = useBreakpoint();
	return getBreakpointValue(value, breakpoint);
};

export const useBreakpointMap = <T extends Record<string, unknown>>(
	value: T,
): { [key in keyof T]: T[key] extends Breakpoint<infer V> ? V : T } => {
	const breakpoint = useBreakpoint();
	// @ts-ignore
	return Object.fromEntries(
		Object.entries(value).map(([key, val]) => [key, getBreakpointValue(val, breakpoint)]),
	);
};
