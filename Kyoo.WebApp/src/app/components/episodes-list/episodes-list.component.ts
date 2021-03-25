import { Component, Input, QueryList, ViewChildren } from "@angular/core";
import { MatMenuTrigger } from "@angular/material/menu";
import { DomSanitizer, SafeStyle } from "@angular/platform-browser";
import { Episode } from "../../models/resources/episode";
import { HorizontalScroller } from "../../misc/horizontal-scroller";
import { Page } from "../../models/page";
import { HttpClient } from "@angular/common/http";

@Component({
	selector: "app-episodes-list",
	templateUrl: "./episodes-list.component.html",
	styleUrls: ["./episodes-list.component.scss"]
})
export class EpisodesListComponent extends HorizontalScroller
{
	@Input() displayShowTitle = false;
	@Input() episodes: Page<Episode>;
	@ViewChildren(MatMenuTrigger) menus: QueryList<MatMenuTrigger>;
	openedIndex: number = undefined;

	constructor(private sanitizer: DomSanitizer, public client: HttpClient)
	{
		super();
	}

	sanitize(url: string): SafeStyle
	{
		return this.sanitizer.bypassSecurityTrustStyle("url(" + url + ")");
	}

	openMenu(index: number): void
	{
		const menu: MatMenuTrigger = this.menus.find((x, i) => i === index);
		menu.focus();
		menu.openMenu();
	}
}
