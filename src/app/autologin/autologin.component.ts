import {Component, OnInit} from '@angular/core';
import {AuthService} from "../services/auth.service";

@Component({
	selector: 'app-autologin',
	templateUrl: './autologin.component.html',
	styleUrls: ['./autologin.component.scss']
})
export class AutologinComponent implements OnInit 
{
	constructor(private authManager: AuthService) 
	{
		this.authManager.oidcSecurityService.onModuleSetup.subscribe(() => 
		{
			this.authManager.login();
		})
	}

	ngOnInit(): void 
	{
		if (this.authManager.oidcSecurityService.moduleSetup) {
			this.authManager.login();
		}
	}
}
