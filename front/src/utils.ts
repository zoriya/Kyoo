import { NavigationContext, useRoute } from "@react-navigation/native";
import { useContext } from "react";

export function setServerData(key: string, val: any) {}
export function getServerData(key: string) {
	return key;
}

export const useQueryState = <S>(key: string, initial: S) => {
	const route = useRoute();
	const nav = useContext(NavigationContext);

	const state = ((route.params as any)?.[key] as S) ?? initial;
	const update = (val: S | ((old: S) => S)) => {
		nav!.setParams({ [key]: val });
	};
	return [state, update] as const;
};
