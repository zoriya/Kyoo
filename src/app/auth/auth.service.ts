import {Injectable} from '@angular/core';
import {AuthorizationResult, AuthorizationState, OidcSecurityService, ValidationResult} from "angular-auth-oidc-client";
import {HttpClient} from "@angular/common/http";
import {Account} from "../../models/account";
import {Router} from "@angular/router";

@Injectable({
	providedIn: 'root'
})
export class AuthService 
{
	isAuthenticated: boolean = false;
	user: any;
	
	constructor(public oidcSecurityService: OidcSecurityService, private http: HttpClient, private router: Router)
	{
		if (this.oidcSecurityService.moduleSetup)
			this.authorizeCallback();
		else 
			this.oidcSecurityService.onModuleSetup.subscribe(() => 
			{
				this.authorizeCallback();
			});

		this.oidcSecurityService.onAuthorizationResult.subscribe((authorizationResult: AuthorizationResult) => 
		{
			this.getUser();
			this.isAuthenticated = authorizationResult.authorizationState == AuthorizationState.authorized;
			this.router.navigate(["/"]);
		});
		this.getUser();
	}

	getUser()
	{
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
		document.cookie = "Authenticated=false; expires=" + new Date(2147483647 * 1000).toUTCString();
		this.http.get("api/account/logout").subscribe(() => 
		{
			this.oidcSecurityService.logoff();
		});
	}

	private authorizeCallback() 
	{
		if (window.location.href.indexOf("?code=") != -1)
			this.oidcSecurityService.authorizedCallbackWithCode(window.location.toString());
		else if (window.location.href.indexOf("/login") == -1)
		{
			this.oidcSecurityService.getIsAuthorized().subscribe((authorized: boolean) =>
			{
				this.isAuthenticated = authorized;
				if (!authorized)
				{
					if (document.cookie.indexOf("Authenticated=true") != -1)
						this.router.navigate(['/autologin']);
				}
				else
					document.cookie = "Authenticated=true; expires=" + new Date(2147483647 * 1000).toUTCString();
			});
		}
	}

	getAccount(): Account
	{
		if (!this.isAuthenticated)
			return null;
		return {email: this.user.email, username: this.user.username, picture: this.user.picture};
	}
}
