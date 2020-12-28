import {Component} from '@angular/core';
import {Event, Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError} from '@angular/router';
import {Location} from "@angular/common";
import {MatDialog} from "@angular/material/dialog";
import {AccountComponent} from "./auth/account/account.component";
import {AuthService} from "./auth/auth.service";
import {Library} from "./models/resources/library";
import {LibraryService} from "./services/api.service";
import * as $ from "jquery";

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class AppComponent
{
	libraries: Library[];
	isLoading: boolean = false;

	static isMobile: boolean = false;

	constructor(private libraryService: LibraryService,
	            private router: Router,
	            private location: Location,
	            public authManager: AuthService,
	            public dialog: MatDialog)
	{
		libraryService.getAll().subscribe(result =>
		{
			this.libraries = result.items;
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
					break;
			}
		});

		AppComponent.isMobile = !!navigator.userAgent.match(/Mobi/);
		if (!AppComponent.isMobile)
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
			this.router.navigate(["/search", query], { replaceUrl: this.router.url.startsWith("/search") });
		}
		else
		{
			event.target.classList.remove("searching");
			this.location.back();
		}
	}
	
	openAccountDialog()
	{
		this.dialog.open(AccountComponent, {width: "500px", data: this.authManager.account});
	}
	
	get isAuthenticated(): boolean
	{
		return this.authManager.isAuthenticated;
	}
}
