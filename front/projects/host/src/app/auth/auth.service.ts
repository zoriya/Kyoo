import { Injectable } from "@angular/core";
import { Account } from "../models/account";

@Injectable({
	providedIn: "root"
})
export class AuthService
{
	isAuthenticated: boolean = false;
	account: Account = null;

	constructor()
	{
	}

	login(): void
	{
	}

	logout(): void
	{
	}
}
