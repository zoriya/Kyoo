import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Event, Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import * as $ from "jquery";
import { Location } from "@angular/common";
import {AuthService} from "./services/auth.service";
import {MatDialog} from "@angular/material/dialog";
import {AccountComponent} from "./account/account.component";
import {Account} from "../models/account";

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class AppComponent
{
	libraries: Library[];
	isLoading: boolean = false;

	constructor(private http: HttpClient, private router: Router, private location: Location, private authManager: AuthService, public dialog: MatDialog)
	{
		http.get<Library[]>("api/libraries").subscribe(result =>
		{
			this.libraries = result;
		}, error => console.error(error));

		this.router.events.subscribe((event: Event) =>
		{
			switch (true)
			{
				case event instanceof NavigationStart:
					this.isLoading = true;
					break;

				case event instanceof NavigationEnd:
				case event instanceof NavigationCancel:
				case event instanceof NavigationError:
					this.isLoading = false;
					break;
				default:
					this.isLoading = false;
					break;
			}
		});

		if (!navigator.userAgent.match(/Mobi/))
			document.body.classList.add("hoverEnabled");
	}

	openSearch()
	{
		let input: HTMLInputElement = <HTMLInputElement>document.getElementById("search");

		input.value = "";
		input.focus();
	}

	onUpdateValue(event)
	{
		let query: string = event.target.value;
		if (query != "")
		{
			event.target.classList.add("searching");
			this.router.navigate(["/search/" + query], { replaceUrl: this.router.url.startsWith("/search/") });
		}
		else
		{
			event.target.classList.remove("searching");
			this.location.back();
		}
	}
	
	openAccountDialog()
	{
		const dialog = this.dialog.open(AccountComponent, {width: "500px", data: this.authManager.getAccount()});
		dialog.afterClosed().subscribe((result: Account) => 
		{
			this.authManager.getUser();
		});
	}
	
	get isAuthenticated(): boolean
	{
		return this.authManager.isAuthenticated;
	}
}

interface Library
{
	id: number;
	slug: string;
	name: string;
}
