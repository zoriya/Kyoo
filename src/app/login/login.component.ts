import { Component, OnInit } from '@angular/core';
import {FormControl, FormGroup, Validators} from "@angular/forms";

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
	
	constructor() { }
	
	async login()
	{
		
	}

	async signin()
	{
		console.log("Signing in")
	}
}
