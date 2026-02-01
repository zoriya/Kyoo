import { type ClassValue, clsx } from "clsx";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback } from "react";
import { twMerge } from "tailwind-merge";
import type { Movie, Show } from "~/models";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function setServerData(_key: string, _val: any) {}
export function getServerData(key: string) {
	return key;
}

export const useQueryState = <S>(key: string, initial: S) => {
	const params = useLocalSearchParams();
	const router = useRouter();

	const state = (params[key] as S) ?? initial;
	const update = useCallback(
		(val: S | ((old: S) => S)) => {
			router.setParams({ [key]: val } as any);
		},
		[router, key],
	);
	return [state, update] as const;
};

export const getDisplayDate = ({
	startAir,
	endAir,
	airDate,
}: {
	startAir?: Date | null;
	endAir?: Date | null;
	airDate?: Date | null;
}) => {
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

// shuffle an array in place, stolen from https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
export function shuffle<T>(array: T[]): T[] {
	let currentIndex = array.length;

	while (currentIndex !== 0) {
		const randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex--;

		[array[currentIndex], array[randomIndex]] = [
			array[randomIndex],
			array[currentIndex],
		];
	}

	return array;
}
