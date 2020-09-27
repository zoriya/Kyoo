import { Component, Input, OnInit } from "@angular/core";
import { FormControl } from "@angular/forms";
import { ActivatedRoute, ActivatedRouteSnapshot, Params, Router } from "@angular/router";
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
import { Observable } from "rxjs"
import { map, startWith, tap } from "rxjs/operators"

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

	sortType: string = "title";
	sortKeys: string[] = ["title", "start year", "end year"]
	sortUp: boolean = true;

	public static readonly showOnlyFilters: string[] = ["genres", "studio"]
	public static readonly filters: string[] = [].concat(...ItemsGridComponent.showOnlyFilters)
	filters: {genres: Genre[], studio: Studio} = {genres: [], studio: null};
	genres: Genre[] = [];
	studios: Studio[] = [];

	studioForm: FormControl = new FormControl();
	filteredStudios: Observable<Studio[]>;

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
		this.route.queryParams.subscribe((data) =>
		{
			this.updateGenresFilterFromQuery(data);
			this.updateStudioFilterFromQuery(data);
		});
		this.loader.load<Genre>("/api/genres?limit=0").subscribe(data =>
		{
			this.genres = data;
			this.updateGenresFilterFromQuery(this.route.snapshot.queryParams);
		});
		this.loader.load<Studio>("/api/studios?limit=0").subscribe(data =>
		{
			this.studios = data;
			this.updateStudioFilterFromQuery(this.route.snapshot.queryParams);
		});
	}

	updateGenresFilterFromQuery(query: Params)
	{
		let selectedGenres: string[] = [];
		if (query.genres?.startsWith("ctn:"))
			selectedGenres = query.genres.substr(4).split(',');
		else if (query.genres != null)
			selectedGenres = query.genres.split(',');
		if (this.router.url.startsWith("/genre"))
			selectedGenres.push(this.route.snapshot.params.slug);

		this.filters.genres = this.genres.filter(x => selectedGenres.includes(x.slug));
	}

	updateStudioFilterFromQuery(query: Params)
	{
		this.filters.studio = this.studios.find(x => x.slug == query.studio
			|| x.slug == this.route.snapshot.params.slug);
	}

	ngOnInit()
	{
		this.filteredStudios = this.studioForm.valueChanges
			.pipe(
				map(x => x == null ? "" : x),
				map(x => typeof x === "string" ? x : x.name),
				map(x => this.studios.filter(y => y.name.toLowerCase().indexOf(x.toLowerCase()) != -1))
			);
	}

	shouldDisplayNoneStudio()
	{
		return this.studioForm.value == '' || typeof this.studioForm.value != "string";
	}

	// TODO add /people to the switch list.

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

	getFilterCount()
	{
		let count: number = this.filters.genres.length;
		if (this.filters.studio != null)
			count++;
		return count;
	}

	addFilter(category: string, filter: IResource, isArray: boolean = true, toggle: boolean = false)
	{
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
			{
				if (!toggle)
					return;
				this.filters[category] = null;
			}
			else
				this.filters[category] = filter;
		}

		let param: string = null;
		if (isArray && this.filters[category].length > 0)
			param = `${this.filters[category].map(x => x.slug).join(',')}`;
		else if (!isArray && this.filters[category] != null)
			param = filter.slug;

		if (/\/browse($|\?)/.test(this.router.url)
			|| this.router.url.startsWith("/genre")
			|| this.router.url.startsWith("/studio"))
		{
			if (this.filters.genres.length == 1 && this.getFilterCount() == 1)
			{
				this.router.navigate(["genre", this.filters.genres[0].slug], {
					replaceUrl: true,
					queryParams: {sortBy: this.route.snapshot.queryParams.sortBy}
				});
				return;
			}
			if (this.filters.studio != null && this.getFilterCount() == 1)
			{
				this.router.navigate(["studio", this.filters.studio.slug], {
					replaceUrl: true,
					queryParams: {sortBy: this.route.snapshot.queryParams.sortBy}
				});
				return;
			}
 			if (this.getFilterCount() == 0 || this.router.url != "/browse")
			{
				let params = {[category]: param}
				if (this.router.url.startsWith("/studio") && category != "studio")
					params.studio = this.route.snapshot.params.slug;
				if (this.router.url.startsWith("/genre") && category != "genres")
					params.genres = `${this.route.snapshot.params.slug}`;

				this.router.navigate(["/browse"], {
					queryParams: params,
					replaceUrl: true,
					queryParamsHandling: "merge"
				});
				return;
			}
		}
		this.router.navigate([], {
			relativeTo: this.route,
			queryParams: {[category]: param},
			replaceUrl: true,
			queryParamsHandling: "merge"
		});
	}

	nameGetter(obj: Studio)
	{
		return obj?.name ?? "None";
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
