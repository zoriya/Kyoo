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

import { useQueryClient } from "@tanstack/react-query";
import { atom, getDefaultStore, useAtomValue, useSetAtom } from "jotai";
import {
	type ReactNode,
	createContext,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { Platform } from "react-native";
import { useMMKVString } from "react-native-mmkv";
import { z } from "zod";
import { removeAccounts, setCookie, updateAccount } from "./account-internal";
import type { KyooErrors } from "./kyoo-errors";
import { useFetch } from "./query";
import { ServerInfoP, type User, UserP } from "./resources";
import { zdate } from "./utils";

const defaultApiUrl = Platform.OS === "web" ? "/api" : null;
const currentApiUrl = atom<string | null>(defaultApiUrl);
export const getCurrentApiUrl = () => {
	const store = getDefaultStore();
	return store.get(currentApiUrl);
};
export const useCurrentApiUrl = () => {
	return useAtomValue(currentApiUrl);
};
export const setSsrApiUrl = () => {
	const store = getDefaultStore();
	store.set(currentApiUrl, process.env.KYOO_URL ?? "http://localhost:5000");
};


export const useAccount = () => {
	const acc = useContext(AccountContext);
	return acc.find((x) => x.selected) || null;
};

export const useAccounts = () => {
	return useContext(AccountContext);
};

export const useHasPermission = (perms?: string[]) => {
	const account = useAccount();
	const { data } = useFetch({
		path: ["info"],
		parser: ServerInfoP,
	});

	if (!perms || !perms[0]) return true;

	const available = account?.permissions ?? data?.guestPermissions;
	if (!available) return false;
	return perms.every((perm) => available.includes(perm));
};

