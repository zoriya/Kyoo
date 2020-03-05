import { Component, OnInit } from '@angular/core';
import {AuthService} from "../services/auth.service";

@Component({
	selector: 'app-login',
	templateUrl: './login.component.html',
	styleUrls: ['./login.component.scss']
})
export class LoginComponent 
{
	loginInformation: {email: string, password: string} = {email: "", password: ""};
	signinInformation: {email: string, username: string, password: string} = {email: "", username: "", password: ""};
	hidePassword: boolean = true;
	
	constructor(private authService: AuthService) { }
	
	async login()
	{
		
	}

	async signin()
	{
		this.authService.register(this.signinInformation)
			.subscribe(result => 
			{
				console.log("Sucess: " + result);
			}, error => {
				console.log("Register error: " + error);
			});
		console.log("Register returned");
	}
}
