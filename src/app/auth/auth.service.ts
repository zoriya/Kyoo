import { HttpClient } from "@angular/common/http";
import { Injectable } from '@angular/core';
import { OidcSecurityService } from "angular-auth-oidc-client";
import { Account } from "../models/account";

@Injectable({
	providedIn: 'root'
})
export class AuthService 
{
	isAuthenticated: boolean = false;
	account: Account = null;

	constructor(private oidcSecurityService: OidcSecurityService,
	            private http: HttpClient)
	{
		this.oidcSecurityService.checkAuth()
			.subscribe((auth: boolean) => this.isAuthenticated = auth);
		this.oidcSecurityService.userData$.subscribe(x =>
		{
			if (x == null)
				return;
			this.account = {
				email: x.email,
				username: x.username,
				picture: x.picture,
				permissions: x.permissions.split(',')
			};
		});
	}
	
	login()
	{
		this.oidcSecurityService.authorize();
	}

	logout() 
	{
		// this.http.get("api/account/logout").subscribe(() =>
		// {
			this.oidcSecurityService.logoff();
			// document.cookie = "Authenticated=false; expires=" + new Date(2147483647 * 1000).toUTCString();
		// });
	}
}
