import {Component, Input} from "@angular/core";
import {Collection} from "../../../models/resources/collection";
import {DomSanitizer} from "@angular/platform-browser";
import {HorizontalScroller} from "../../misc/horizontal-scroller";
import {Page} from "../../../models/page";
import {HttpClient} from "@angular/common/http";
import {Show, ShowRole} from "../../../models/resources/show";
import {LibraryItem} from "../../../models/resources/library-item";
import {ItemsUtils} from "../../misc/items-utils";

@Component({
	selector: 'app-items-list',
	templateUrl: './items-list.component.html',
	styleUrls: ['./items-list.component.scss']
})
export class ItemsListComponent extends HorizontalScroller
{
	@Input() items: Page<Collection | Show | LibraryItem | ShowRole>;

	constructor(private sanitizer: DomSanitizer, public client: HttpClient)
	{
		super();
	}

	getThumb(slug: string)
	{
		return this.sanitizer.bypassSecurityTrustStyle("url(/poster/" + slug + ")");
	}

	getDate(item: LibraryItem | Show | ShowRole | Collection)
	{
		return ItemsUtils.getDate(item);
	}

	getLink(item: LibraryItem | Show | ShowRole | Collection)
	{
		return ItemsUtils.getLink(item);
	}
}