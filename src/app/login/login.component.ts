import { Component, OnInit } from '@angular/core';
import {FormControl, Validators} from "@angular/forms";

@Component({
	selector: 'app-login',
	templateUrl: './login.component.html',
	styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit 
{
	username = new FormControl("", [Validators.required]);
	password = new FormControl("", [Validators.required]);
	email = new FormControl("", [Validators.required, Validators.email]);
	
	hidePassword: boolean = true;
	
	constructor() { }

	ngOnInit() 
	{
	}
	
	async login()
	{
		
	}
}
