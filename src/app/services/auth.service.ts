import { Injectable } from '@angular/core';
import {OidcSecurityService} from "angular-auth-oidc-client";

@Injectable({
	providedIn: 'root'
})
export class AuthService 
{
	isAuthenticated: boolean;
	user: any;
	
	constructor(public oidcSecurityService: OidcSecurityService)
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
		this.oidcSecurityService.logoff();
	}

	private authorizeCallback() 
	{
		this.oidcSecurityService.authorizedCallbackWithCode(window.location.toString());
	}
}
