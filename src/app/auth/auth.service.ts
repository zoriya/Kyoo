import { Injectable } from "@angular/core";
import { LoginResponse, OidcSecurityService } from "angular-auth-oidc-client";
import { Account } from "../models/account";
import { HttpClient } from "@angular/common/http";

@Injectable({
	providedIn: "root"
})
export class AuthService
{
	isAuthenticated: boolean = false;
	account: Account = null;

	constructor(private oidcSecurityService: OidcSecurityService, private http: HttpClient)
	{
		this.oidcSecurityService.checkAuth()
			.subscribe((auth: LoginResponse) => this.isAuthenticated = auth.isAuthenticated);
		this.oidcSecurityService.userData$.subscribe(x =>
		{
			if (x?.userData == null)
			{
				this.account = null;
				this.isAuthenticated = false;
				return;
			}
			this.account = {
				email: x.userData.email,
				username: x.userData.username,
				picture: x.userData.picture,
				permissions: x.userData.permissions?.split(",") ?? []
			};
		});
	}

	login(): void
	{
		this.oidcSecurityService.authorize();
	}

	logout(): void
	{
		this.http.get("api/account/logout").subscribe(() =>
		{
			this.oidcSecurityService.logoff();
		});
	}
}
