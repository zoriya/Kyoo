import { Injectable } from '@angular/core';
import {UserManager, UserManagerSettings, User, Profile} from 'oidc-client';

@Injectable({
	providedIn: 'root'
})
export class AuthService 
{
	user: User | null;
	private _userManager = new UserManager(this.getClientSettings());
	
	constructor()
	{
		this._userManager.getUser().then(user => 
		{
			this.user = user;
			if (user)
				console.log("Logged in as: " + user.profile.name);
			else 
				console.log("Not logged in.");
		});
	}

	isLoggedIn(): boolean 
	{
		return this.user != null && !this.user.expired;
	}

	getClaims(): Profile 
	{
		return this.user.profile;
	}

	login()
	{
		return this._userManager.signinRedirect();
	}

	loginCallback()
	{
		return this._userManager.signinCallback().then(user => 
		{
			this.user = user;
			console.log("Logged in!");
		});
	}
	
	getClientSettings(): UserManagerSettings 
	{
		return {
			authority: window.location.origin,
			client_id: "kyoo.webapp",
			redirect_uri: "/logged",
			silent_redirect_uri: "/silent",
			response_type: "code",
			scope: "openid profile kyoo.read offline_access",
			automaticSilentRenew: true
		};
	}
}
