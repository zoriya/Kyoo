import { NavigationContext, useRoute } from "@react-navigation/native";
import { useCallback, useContext } from "react";
import type { Movie, Show } from "~/models";

export function setServerData(_key: string, _val: any) {}
export function getServerData(key: string) {
	return key;
}

export const useQueryState = <S>(key: string, initial: S) => {
	const route = useRoute();
	const nav = useContext(NavigationContext);

	const state = ((route.params as any)?.[key] as S) ?? initial;
	const update = useCallback(
		(val: S | ((old: S) => S)) => {
			nav!.setParams({ [key]: val });
		},
		[nav, key],
	);
	return [state, update] as const;
};

export const getDisplayDate = (data: Show | Movie) => {
	const {
		startAir,
		endAir,
		airDate,
	}: { startAir?: Date | null; endAir?: Date | null; airDate?: Date | null } =
		data;

	if (startAir) {
		if (!endAir || startAir.getFullYear() === endAir.getFullYear()) {
			return startAir.getFullYear().toString();
		}
		return (
			startAir.getFullYear() + (endAir ? ` - ${endAir.getFullYear()}` : "")
		);
	}
	if (airDate) {
		return airDate.getFullYear().toString();
	}
	return null;
};

export const displayRuntime = (runtime: number | null) => {
	if (!runtime) return null;
	if (runtime < 60) return `${runtime}min`;
	return `${Math.floor(runtime / 60)}h${runtime % 60}`;
};
