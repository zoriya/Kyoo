import { Component, Input } from "@angular/core";
import { DomSanitizer, SafeStyle } from "@angular/platform-browser";
import { People } from "../../models/resources/people";
import { HorizontalScroller } from "../../misc/horizontal-scroller";
import { Page } from "../../models/page";
import { HttpClient } from "@angular/common/http";

@Component({
	selector: "app-people-list",
	templateUrl: "./people-list.component.html",
	styleUrls: ["./people-list.component.scss"]
})
export class PeopleListComponent extends HorizontalScroller
{
	@Input() people: Page<People>;

	constructor(private sanitizer: DomSanitizer, public client: HttpClient)
	{
		super();
	}

	getPeopleIcon(item: People): SafeStyle
	{
		return this.sanitizer.bypassSecurityTrustStyle(`url(${item.poster})`);
	}
}
