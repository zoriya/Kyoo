import {Component, Input} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {DomSanitizer} from '@angular/platform-browser';
import {ItemType, LibraryItem} from "../../../models/library-item";
import {Page} from "../../../models/page";
import {HttpClient} from "@angular/common/http";
import {Show} from "../../../models/show";

@Component({
	selector: 'app-items',
	templateUrl: './items-grid.component.html',
	styleUrls: ['./items-grid.component.scss']
})
export class ItemsGridComponent
{
	@Input() page: Page<LibraryItem | Show>;
	@Input() sortEnabled: boolean = true;
	sortType: string = "title";
	sortKeys: string[] = ["title", "start year", "end year"]
	sortUp: boolean = true;

	constructor(private route: ActivatedRoute,
	            private sanitizer: DomSanitizer,
	            public client: HttpClient)
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

	getLink(item: LibraryItem | Show)
	{
		if ("type" in item && item.type == ItemType.Collection)
			return "/collection/" + item.slug;
		else
			return "/show/" + item.slug;
	}

	sort(type: string, order: boolean)
	{
		this.sortType = type;
		this.sortUp = order;

		let url: URL = new URL(this.page.first);
		url.searchParams.set("sortBy", `${this.sortType.replace(/\s/g, "")}:${this.sortUp ? "asc" : "desc"}`);
		this.client.get<Page<LibraryItem | Show>>(url.toString())
			.subscribe(x => this.page = Object.assign(new Page<LibraryItem | Show>(), x));
	}
}
