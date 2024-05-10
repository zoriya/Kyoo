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

import { useMMKVString } from "react-native-mmkv";
import { setCookie, storage } from "./account-internal";
import { Platform } from "react-native";

export const useUserTheme = (ssrTheme?: "light" | "dark" | "auto") => {
	if (Platform.OS === "web" && typeof window === "undefined" && ssrTheme) return ssrTheme;
	const [value] = useMMKVString("theme", storage);
	if (!value) return "auto";
	return value as "light" | "dark" | "auto";
};

export const setUserTheme = (theme: "light" | "dark" | "auto") => {
	storage.set("theme", theme);
	if (Platform.OS === "web") setCookie("theme", theme);
};
