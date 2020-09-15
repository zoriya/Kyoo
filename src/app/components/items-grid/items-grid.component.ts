import {Component, Input} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {DomSanitizer} from '@angular/platform-browser';
import { Genre } from "../../../models/resources/genre";
import {LibraryItem} from "../../../models/resources/library-item";
import {Page} from "../../../models/page";
import {HttpClient} from "@angular/common/http";
import {Show, ShowRole} from "../../../models/resources/show";
import {Collection} from "../../../models/resources/collection";
import {ItemsUtils} from "../../misc/items-utils";
import { PreLoaderService } from "../../services/pre-loader.service";

@Component({
	selector: 'app-items-grid',
	templateUrl: './items-grid.component.html',
	styleUrls: ['./items-grid.component.scss']
})
export class ItemsGridComponent
{
	@Input() page: Page<LibraryItem | Show | ShowRole | Collection>;
	@Input() sortEnabled: boolean = true;
	sortType: string = "title";
	sortKeys: string[] = ["title", "start year", "end year"]
	sortUp: boolean = true;
	filters: {genres: Genre[]} = {genres: []};
	genres: Genre[] = [];

	constructor(private route: ActivatedRoute,
	            private sanitizer: DomSanitizer,
	            private loader: PreLoaderService,
	            public client: HttpClient)
	{
		this.route.data.subscribe((data) =>
		{
			this.page = data.items;
		});
		this.loader.load<Genre>("/api/genres?limit=0").subscribe(data =>
		{
			this.genres = data;
		});
	}

	getFilterCount()
	{
		return this.filters.genres.length;
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
