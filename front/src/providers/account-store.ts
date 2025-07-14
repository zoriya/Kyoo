import { Platform } from "react-native";
import { z } from "zod/v4";
import { Account } from "~/models";
import { readValue, setCookie, storeValue } from "./settings";

const writeAccounts = (accounts: Account[]) => {
	storeValue("accounts", accounts);
	if (Platform.OS === "web") {
		const selected = accounts.find((x) => x.selected);
		if (!selected) return;
		setCookie("account", selected);
		// cookie used for images and videos since we can't add Authorization headers in img or video tags.
		setCookie("X-Bearer", selected?.token);
	}
};

export const addAccount = (account: Account) => {
	const accounts = readValue("accounts", z.array(Account)) ?? [];

	// Prevent the user from adding the same account twice.
	if (accounts.find((x) => x.id === account.id)) {
		updateAccount(account.id, account);
		return;
	}

	for (const acc of accounts) acc.selected = false;
	account.selected = true;
	accounts.push(account);
	writeAccounts(accounts);
};

export const removeAccounts = (filter: (acc: Account) => boolean) => {
	let accounts = readValue("accounts", z.array(Account)) ?? [];
	accounts = accounts.filter((x) => !filter(x));
	if (!accounts.find((x) => x.selected) && accounts.length > 0) {
		accounts[0].selected = true;
	}
	writeAccounts(accounts);
};

export const updateAccount = (id: string, account: Account) => {
	const accounts = readValue("accounts", z.array(Account)) ?? [];
	const idx = accounts.findIndex((x) => x.id === id);
	if (idx === -1) return;

	const selected = account.selected;
	if (selected) {
		for (const acc of accounts) acc.selected = false;
		// if account was already on the accounts list, we keep it selected.
		account.selected = selected;
	} else if (accounts[idx].selected) {
		// we just unselected the current account, focus another one.
		if (accounts.length > 0) accounts[0].selected = true;
	}

	accounts[idx] = account;
	writeAccounts(accounts);
};
