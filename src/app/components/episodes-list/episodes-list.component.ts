import { Component, Input, ViewChild } from "@angular/core";
import { MatMenuTrigger } from "@angular/material/menu";
import { DomSanitizer } from "@angular/platform-browser";
import { Episode } from "../../models/resources/episode";
import { HorizontalScroller } from "../../misc/horizontal-scroller";
import { Page } from "../../models/page";
import { HttpClient } from "@angular/common/http";

@Component({
	selector: 'app-episodes-list',
	templateUrl: './episodes-list.component.html',
	styleUrls: ['./episodes-list.component.scss']
})
export class EpisodesListComponent extends HorizontalScroller
{
	@Input() displayShowTitle: boolean = false;
	@Input() episodes: Page<Episode>;
	@ViewChild(MatMenuTrigger) menu: MatMenuTrigger;

	constructor(private sanitizer: DomSanitizer, public client: HttpClient)
	{
		super();
	}

	sanitize(url: string)
	{
		return this.sanitizer.bypassSecurityTrustStyle("url(" + url + ")");
	}

	openMenu(): void
	{
		this.menu.openMenu();
	}
}
