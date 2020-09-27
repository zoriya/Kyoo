import { Component, Input, OnInit } from "@angular/core";
import { ActivatedRoute, ActivatedRouteSnapshot, Router } from "@angular/router";
import { DomSanitizer } from '@angular/platform-browser';
import { Genre } from "../../../models/resources/genre";
import { LibraryItem } from "../../../models/resources/library-item";
import { Page } from "../../../models/page";
import { HttpClient } from "@angular/common/http";
import { IResource } from "../../../models/resources/resource";
import { Show, ShowRole } from "../../../models/resources/show";
import { Collection } from "../../../models/resources/collection";
import { Studio } from "../../../models/resources/studio";
import { ItemsUtils } from "../../misc/items-utils";
import { PreLoaderService } from "../../services/pre-loader.service";

@Component({
	selector: 'app-items-grid',
	templateUrl: './items-grid.component.html',
	styleUrls: ['./items-grid.component.scss']
})
export class ItemsGridComponent implements OnInit
{
	@Input() page: Page<LibraryItem | Show | ShowRole | Collection>;
	@Input() sortEnabled: boolean = true;

	complexFiltersEnabled: boolean;
	defaultType: string;

	sortType: string = "title";
	sortKeys: string[] = ["title", "start year", "end year"]
	sortUp: boolean = true;

	public static readonly showOnlyFilters: string[] = ["genres", "studio"]
	public static readonly filters: string[] = [].concat(...ItemsGridComponent.showOnlyFilters)
	filters: {genres: Genre[], studio: Studio} = {genres: [], studio: null};
	genres: Genre[] = [];
	studios: Studio[] = [];

	constructor(private route: ActivatedRoute,
	            private sanitizer: DomSanitizer,
	            private loader: PreLoaderService,
	            public client: HttpClient,
	            private router: Router)
	{
		this.route.data.subscribe((data) =>
		{
			this.page = data.items;
		});
		this.loader.load<Genre>("/api/genres?limit=0").subscribe(data =>
		{
			this.genres = data;
			let selectedGenres: string[] = [];
			if (this.route.snapshot.queryParams.genres?.startsWith("ctn:"))
				selectedGenres = this.route.snapshot.queryParams.genres.substr(4).split(',');
			this.filters.genres = this.genres.filter(x => selectedGenres.includes(x.slug));
		});
		this.loader.load<Studio>("/api/studios?limit=0").subscribe(data =>
		{
			this.studios = data;
			this.filters.studio = this.studios.find(x => x.slug == this.route.params["studio"]);
		});
	}

	// TODO support dynamic switching between /genre & /browse & /whatever.

	/*
	* /browse           -> /api/items | /api/shows
	* /browse/:library  -> /api/library/:slug/items | /api/library/:slug/shows
	* /genre/:slug      -> /api/shows
	* /studio/:slug     -> /api/shows
	*
	* /collection/:slug -> /api/collection/:slug/shows   |> AS @Input
	* /people/:slug     -> /api/people/:slug/roles       |> AS @Input
	*/

	static routeMapper(route: ActivatedRouteSnapshot, endpoint: string, query: [string, string][]): string
	{
		let queryParams: [string, string][] = Object.entries(route.queryParams)
			.filter(x => ItemsGridComponent.filters.includes(x[0]) || x[0] == "sortBy");
		if (query)
			queryParams.push(...query)

		if (queryParams.some(x => ItemsGridComponent.showOnlyFilters.includes(x[0])))
			endpoint = endpoint.replace(/items?$/, "show");

		let params: string = queryParams.length > 0
			? '?' + queryParams.map(x => `${x[0]}=${x[1]}`).join('&')
			: "";
		return `api/${endpoint}${params}`
	}

	ngOnInit()
	{
		this.defaultType = this.page.this.match(/\/(\w*)($|\?)/)[1];
		this.complexFiltersEnabled = this.defaultType == "shows" || this.defaultType == "items";
	}

	getFilterCount()
	{
		let count: number = this.filters.genres.length;
		if (this.filters.studio != null)
			count++;
		return count;
	}

	addFilter(category: string, filter: IResource, isArray: boolean = true, isShowOnly: boolean = true)
	{
		if (!this.complexFiltersEnabled && isShowOnly)
			return;

		if (isArray)
		{
			if (this.filters[category].includes(filter))
				this.filters[category].splice(this.filters[category].indexOf(filter), 1);
			else
				this.filters[category].push(filter);
		}
		else
		{
			if (this.filters[category] == filter)
				this.filters[category] = null;
			else
				this.filters[category] = filter;
		}

		let param: string = null;
		if (isArray && this.filters[category].length > 0)
			param = `ctn:${this.filters[category].map(x => x.slug).join(',')}`;
		else if (!isArray && this.filters[category] != null)
			param = filter.slug;

		this.router.navigate([], {
			relativeTo: this.route,
			queryParams: { [category]: param },
			replaceUrl: true,
			queryParamsHandling: "merge"
		});
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

		let param: string = `${this.sortType.replace(/\s/g, "")}:${this.sortUp ? "asc" : "desc"}`;
		this.router.navigate([], {
			relativeTo: this.route,
			queryParams: { sortBy: param },
			replaceUrl: true,
			queryParamsHandling: "merge"
		});
	}
}
