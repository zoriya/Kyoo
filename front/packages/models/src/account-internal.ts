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

import { z } from "zod";
import { Account, AccountP } from "./accounts";
import { MMKV } from "react-native-mmkv";

const storage = new MMKV();

const readAccounts = () => {
	const acc = storage.getString("accounts");
	if (!acc) return [];
	return z.array(AccountP).parse(JSON.parse(acc));
};

const writeAccounts = (accounts: Account[]) => {
	storage.set("accounts", JSON.stringify(accounts));
};

export const setAccountCookie = (account?: Account) => {
	let value = JSON.stringify(account);
	// Remove illegal values from json. There should not be one in the account anyways.
	value = value?.replaceAll(";", "");
	const d = new Date();
	// A year
	d.setTime(d.getTime() + 365 * 24 * 60 * 60 * 1000);
	const expires = value ? "expires=" + d.toUTCString() : "expires=Thu, 01 Jan 1970 00:00:01 GMT";
	document.cookie = "account=" + value + ";" + expires + ";path=/;samesite=strict";
	return null;
};

export const readAccountCookie = (cookies?: string) => {
	if (!cookies) return null;
	const name = "account=";
	const decodedCookie = decodeURIComponent(cookies);
	const ca = decodedCookie.split(";");
	for (let i = 0; i < ca.length; i++) {
		let c = ca[i];
		while (c.charAt(0) == " ") {
			c = c.substring(1);
		}
		if (c.indexOf(name) == 0) {
			const str = c.substring(name.length, c.length);
			return AccountP.parse(JSON.parse(str));
		}
	}
	return null;
};

export const getCurrentAccount = () => {
	const accounts = readAccounts();
	return accounts.find((x) => x.selected);
};

export const addAccount = (account: Account) => {
	const accounts = readAccounts();

	// Prevent the user from adding the same account twice.
	if (accounts.find((x) => x.id == account.id)) {
		updateAccount(account.id, account);
		return;
	}

	for (const acc of accounts) acc.selected = false;
	accounts.push(account);
	writeAccounts(accounts);
};

export const removeAccounts = (filter: (acc: Account) => boolean) => {
	let accounts = readAccounts();
	accounts = accounts.filter((x) => !filter(x));
	if (!accounts.find((x) => x.selected) && accounts.length > 0) {
		accounts[0].selected = true;
	}
	writeAccounts(accounts);
};

export const updateAccount = (id: string, account: Account) => {
	const accounts = readAccounts();
	const idx = accounts.findIndex((x) => x.id == id);
	if (idx === -1) return;

	if (account.selected) {
		for (const acc of accounts) acc.selected = false;
	} else if (accounts[idx].selected) {
		// we just unselected the current account, focus another one.
		if (accounts.length > 0) accounts[0].selected = true;
	}

	accounts[idx] = account;
	writeAccounts(accounts);
};

export const unselectAllAccounts = () => {
	const accounts = readAccounts();
	for (const acc of accounts) acc.selected = false;
	writeAccounts(accounts);
}
