import { Component, OnInit } from '@angular/core';
import {AuthService} from "../services/auth.service";
import {Router} from "@angular/router";

@Component({
	selector: 'app-logged',
	templateUrl: './logged.component.html',
	styleUrls: ['./logged.component.scss']
})
export class LoggedComponent implements OnInit 
{
	constructor(private authManager: AuthService, private router: Router) { }

	ngOnInit() 
	{
		this.authManager.loginCallback().then(result => 
		{
		//	this.router.navigateByUrl("");
		});
	}
}
