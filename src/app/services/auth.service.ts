import { Injectable } from '@angular/core';
import { UserManager, UserManagerSettings, User } from 'oidc-client';
import {HttpClient} from "@angular/common/http";
import { catchError } from 'rxjs/operators';
import {EMPTY} from "rxjs";
import {MatSnackBar} from "@angular/material/snack-bar";

@Injectable({
	providedIn: 'root'
})
export class AuthService 
{
	user: User | null;
	private _userManager = new UserManager(this.getClientSettings());
	
	constructor(private http: HttpClient, private snackBar: MatSnackBar)
	{
		this._userManager.getUser().then(user => 
		{
			this.user = user;
			if (user)
				console.log("Logged in as: " + user.profile.name);
		});
	}

	login()
	{
		return this._userManager.signinRedirect();
	}
	
	register(userRegistration: any)
	{
		return this.http.post("/api/account/register", userRegistration).pipe(catchError((error => 
		{
			console.log(error.status + " - " + error.message);
			this.snackBar.open(`An unknown error occured: ${error.message}.`, null, { horizontalPosition: "left", panelClass: ['snackError'], duration: 2500 });
			return EMPTY;
		})));
	}
	
	getClientSettings(): UserManagerSettings 
	{
		return {
			authority: "",
			client_id: "kyoo.webapp",
			redirect_uri: "/logged",
			response_type:"id_token token",
			scope:"openid profile kyoo.read"
		};
	}
}
