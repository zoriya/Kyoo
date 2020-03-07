import { Component } from '@angular/core';
import {AuthService} from "../services/auth.service";
import {ActivatedRoute, Router} from "@angular/router";

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
	redirectURI: string = "/";
	
	constructor(private authService: AuthService, private router: Router, private route: ActivatedRoute) 
	{
		if (this.route.snapshot.queryParams["redirectURI"])
			this.redirectURI = this.route.snapshot.queryParams["redirectURI"];
		if (this.route.snapshot.queryParams["otac"])
			this.useOTAC(this.route.snapshot.queryParams["otac"]);
	}
	
	async login()
	{
		this.authService.login(this.loginInformation)
			.subscribe(() =>
			{
				this.router.navigateByUrl(this.redirectURI);
			}, error => {
				console.log("Login error: " + error);
			});
	}
	
	useOTAC(otac: string)
	{
		console.log("Got an OTAC: " + otac);
	}

	async signin()
	{
		this.authService.register(this.signinInformation)
			.subscribe(result => 
			{
				this.useOTAC(result);
			}, error => {
				console.log("Register error: " + error);
			});
	}
}
