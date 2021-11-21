import { Component } from "@angular/core";
import {
	Event,
	Router,
	NavigationStart,
	NavigationEnd,
	NavigationCancel,
	NavigationError
} from "@angular/router";
import { Location } from "@angular/common";
import { MatDialog } from "@angular/material/dialog";
import { AccountComponent } from "./auth/account/account.component";
import { AuthService } from "./auth/auth.service";
import { Library } from "./models/resources/library";
import { LibraryService } from "./services/api.service";
// noinspection ES6UnusedImports
import * as $ from "jquery";
import ChangeEvent = JQuery.ChangeEvent;

@Component({
	selector: "app-root",
	templateUrl: "./app.component.html",
	styleUrls: ["./app.component.scss"]
})
export class AppComponent
{
	static isMobile: boolean = false;
	libraries: Library[];
	isLoading: boolean = false;


	constructor(
		private libraryService: LibraryService,
		private router: Router,
		private location: Location,
		public authManager: AuthService,
		public dialog: MatDialog
	)
	{
		libraryService.getAll().subscribe({
			next: result =>
			{
				this.libraries = result.items;
			},
			error: error => console.error(error)
		});

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

	get isAuthenticated(): boolean
	{
		return this.authManager.isAuthenticated;
	}

	openSearch(): void
	{
		const input: HTMLInputElement = document.getElementById("search") as HTMLInputElement;

		input.value = "";
		input.focus();
	}

	onUpdateValue(event: ChangeEvent<HTMLInputElement>): void
	{
		const query: string = event.target.value;
		if (query !== "")
		{
			event.target.classList.add("searching");
			this.router.navigate(["/search", query], {
				replaceUrl: this.router.url.startsWith("/search")
			});
		} else
		{
			event.target.classList.remove("searching");
			this.location.back();
		}
	}

	openAccountDialog(): void
	{
		this.dialog.open(AccountComponent, {width: "500px", data: this.authManager.account});
	}
}
