import { useWindowDimensions } from "react-native";
import { rem } from "./spacing";

export const breakpoints = {
	xs: 0,
	sm: rem(160),
	md: rem(192),
	lg: rem(256),
	xl: rem(320),
};

type Breakpoints<Property> = {
	[key in keyof typeof breakpoints]?: Property;
};
type AtLeastOne<T, U = { [K in keyof T]: Pick<T, K> }> = Partial<T> &
	U[keyof U];
export type Breakpoint<T> = T | AtLeastOne<Breakpoints<T>>;

// copied from yoshiki.
const isBreakpoints = <T>(value: unknown): value is Breakpoints<T> => {
	if (typeof value !== "object" || !value) return false;
	for (const v of Object.keys(value)) {
		if (!(v in breakpoints)) {
			return false;
		}
	}
	return true;
};

const useBreakpoint = () => {
	const { width } = useWindowDimensions();
	const idx = Object.values(breakpoints).findLastIndex((x) => x <= width);
	if (idx === -1) return 0;
	return idx;
};

const getBreakpointValue = <T>(value: Breakpoint<T>, breakpoint: number): T => {
	if (!isBreakpoints(value)) return value;
	const bpKeys = Object.keys(breakpoints) as Array<keyof Breakpoints<T>>;
	for (let i = breakpoint; i >= 0; i--) {
		const val = value[bpKeys[i]];
		if (val !== undefined) return val;
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
	// @ts-expect-error
	return Object.fromEntries(
		Object.entries(value).map(([key, val]) => [
			key,
			getBreakpointValue(val, breakpoint),
		]),
	);
};
