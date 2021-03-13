import { Component, Input } from "@angular/core";
import { Collection } from "../../models/resources/collection";
import { DomSanitizer, SafeUrl } from "@angular/platform-browser";
import { HorizontalScroller } from "../../misc/horizontal-scroller";
import { Page } from "../../models/page";
import { HttpClient } from "@angular/common/http";
import { Show, ShowRole } from "../../models/resources/show";
import { LibraryItem } from "../../models/resources/library-item";
import { ItemsUtils } from "../../misc/items-utils";

@Component({
	selector: "app-items-list",
	templateUrl: "./items-list.component.html",
	styleUrls: ["./items-list.component.scss"]
})
export class ItemsListComponent extends HorizontalScroller
{
	@Input() items: Page<Collection | Show | LibraryItem | ShowRole>;

	constructor(private sanitizer: DomSanitizer, public client: HttpClient)
	{
		super();
	}

	getPoster(item: LibraryItem | Show | ShowRole | Collection): SafeUrl
	{
		return this.sanitizer.bypassSecurityTrustStyle(`url(${item.poster})`);
	}

	getDate(item: LibraryItem | Show | ShowRole | Collection): string
	{
		return ItemsUtils.getDate(item);
	}

	getLink(item: LibraryItem | Show | ShowRole | Collection): string
	{
		return ItemsUtils.getLink(item);
	}
}
