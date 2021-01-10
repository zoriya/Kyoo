import { Component, Input, QueryList, ViewChild, ViewChildren } from "@angular/core";
import { MatMenuTrigger } from "@angular/material/menu";
import { DomSanitizer } from "@angular/platform-browser";
import { first } from "rxjs/operators";
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
	@ViewChildren(MatMenuTrigger) menus: QueryList<MatMenuTrigger>;
	openedIndex: number = undefined;

	constructor(private sanitizer: DomSanitizer, public client: HttpClient)
	{
		super();
	}

	sanitize(url: string)
	{
		return this.sanitizer.bypassSecurityTrustStyle("url(" + url + ")");
	}

	openMenu(index: number): void
	{
		const menu = this.menus.find((x, i) => i === index);
		menu.focus();
		menu.openMenu();
	}
}
