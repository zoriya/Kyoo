import { Injectable } from '@angular/core';
import {OidcSecurityService} from "angular-auth-oidc-client";
import {HttpClient} from "@angular/common/http";

@Injectable({
	providedIn: 'root'
})
export class AuthService 
{
	isAuthenticated: boolean;
	user: any;
	
	constructor(public oidcSecurityService: OidcSecurityService, private http: HttpClient)
	{
		if (this.oidcSecurityService.moduleSetup)
			this.authorizeCallback();
		else 
			this.oidcSecurityService.onModuleSetup.subscribe(() => 
			{
				this.authorizeCallback();
			});

		this.oidcSecurityService.getIsAuthorized().subscribe(auth => 
		{
			this.isAuthenticated = auth;
		});

		this.oidcSecurityService.getUserData().subscribe(userData => 
		{
			this.user = userData;
		});
	}

	login()
	{
		this.oidcSecurityService.authorize();
	}

	logout() 
	{
		this.http.get("api/account/logout").subscribe(() => 
		{
			this.oidcSecurityService.logoff();
		});
	}

	private authorizeCallback() 
	{
		this.oidcSecurityService.authorizedCallbackWithCode(window.location.toString());
	}
}
