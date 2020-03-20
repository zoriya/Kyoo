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

	loginErrors: [{code: string, description: string}];
	registerErrors: [{code: string, description: string}];
	
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
			this.loginErrors = error.error;
			return EMPTY;
		}))).subscribe(() =>
		{
			window.location.href = this.redirectURI;
		});
	}
	
	useOTAC(otac: string)
	{
		this.http.post("/api/account/otac-login", {"otac": otac}).pipe(catchError((error =>
		{
			this.registerErrors = error.error;
			return EMPTY;
		}))).subscribe(() =>
		{
			window.location.href = this.redirectURI;
		});
	}

	async register()
	{
		// @ts-ignore
		this.http.post<string>("/api/account/register", this.signinInformation, {responseType: "text"}).pipe(catchError((error =>
		{
			this.registerErrors = JSON.parse(error.error);
			return EMPTY;
		}))).subscribe(otac => { this.useOTAC(otac); });
	}
}
