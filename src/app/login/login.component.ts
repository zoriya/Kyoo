import { Component } from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {catchError} from "rxjs/operators";
import {EMPTY} from "rxjs";
import {HttpClient} from "@angular/common/http";
import {MatSnackBar} from "@angular/material/snack-bar";

@Component({
	selector: 'app-login',
	templateUrl: './login.component.html',
	styleUrls: ['./login.component.scss']
})
export class LoginComponent 
{
	loginInformation: {username: string, password: string, stayLoggedIn: boolean} = {username: "", password: "", stayLoggedIn: false};
	signinInformation: {email: string, username: string, password: string} = {email: "", username: "", password: ""};
	hidePassword: boolean = true;
	redirectURI: string;
	
	constructor(private router: Router, private route: ActivatedRoute, private http: HttpClient, private snackBar: MatSnackBar) 
	{
		if (this.route.snapshot.queryParams["ReturnUrl"])
			this.redirectURI = this.route.snapshot.queryParams["ReturnUrl"];
		if (this.route.snapshot.queryParams["otac"])
			this.useOTAC(this.route.snapshot.queryParams["otac"]);
	}
	
	async login()
	{
		this.http.post("/api/account/login", this.loginInformation).pipe(catchError((error =>
		{
			console.log(error.status + " - " + error.message);
			this.snackBar.open(`An unknown error occured: ${error.message}.`, null, { horizontalPosition: "left", panelClass: ['snackError'], duration: 2500 });
			return EMPTY;
		}))).subscribe(() =>
		{
			window.location.href = this.redirectURI;
		}, error => {
			console.log("Login error: " + error);
		});
	}
	
	useOTAC(otac: string)
	{
		console.log("Got an OTAC: " + otac);
	}

	async register()
	{
		// @ts-ignore
		this.http.post<string>("/api/account/register", this.signinInformation, {responseType: "text"}).pipe(catchError((error =>
		{
			console.log(error.status + " - " + error.message);
			this.snackBar.open(`An unknown error occured: ${error.message}.`, null, { horizontalPosition: "left", panelClass: ['snackError'], duration: 2500 });
			return EMPTY;
		}))).subscribe(otac => { this.useOTAC(otac); });
	}
}
