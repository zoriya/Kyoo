import {Component, Input} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {DomSanitizer} from '@angular/platform-browser';
import {ItemType, LibraryItem} from "../../../models/library-item";
import {Page} from "../../../models/page";
import {LibraryItemService} from "../../services/api.service";

@Component({
	selector: 'app-browse',
	templateUrl: './library-item-grid.component.html',
	styleUrls: ['./library-item-grid.component.scss']
})
export class LibraryItemGridComponent
{
	@Input() page: Page<LibraryItem>;
	@Input() sortEnabled: boolean = true;
	sortType: string = "title";
	sortKeys: string[] = ["title", "start year", "end year", "status", "type"]
	sortUp: boolean = true;

	constructor(private route: ActivatedRoute, private sanitizer: DomSanitizer, private items: LibraryItemService)
	{
		this.route.data.subscribe((data) =>
		{
			this.page = data.items;
		});
	}

	getThumb(slug: string)
	{
		return this.sanitizer.bypassSecurityTrustStyle("url(/poster/" + slug + ")");
	}

	getLink(show: LibraryItem)
	{
		if (show.type == ItemType.Collection)
			return "/collection/" + show.slug;
		else
			return "/show/" + show.slug;
	}

	sort(type: string, order: boolean)
	{
		this.sortType = type;
		this.sortUp = order;

		this.items.getAll({sort: `${this.sortType.replace(/\s/g, "")}:${this.sortUp ? "asc" : "desc"}`})
			.subscribe(x => this.page = x);
	}
}
