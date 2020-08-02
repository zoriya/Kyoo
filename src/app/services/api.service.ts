import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs"
import {Page} from "../../models/page";
import {IResource} from "../../models/resources/resource";
import {Library} from "../../models/library";
import {LibraryItem} from "../../models/library-item";
import {map} from "rxjs/operators";
import {Season} from "../../models/season";
import {Episode} from "../../models/episode";

export interface ApiArgs
{
	sortBy?: string;
	limit?: number;
	afterID?: number;
	[key: string]: any;
}

class CrudApi<T extends IResource>
{
	constructor(protected client: HttpClient, private route: string) {}

	get(id: number | string): Observable<T>
	{
		return this.client.get<T>(`/api/${this.route}/${id}`);
	}

	protected ArgsAsQuery(args: ApiArgs): string
	{
		if (args == null)
			return "";
		let params: string = Object.keys(args).map(x => `${x}=${args[x]}`).join("&");

		return params ? `?${params}` : "";
	}

	getAll(args?: ApiArgs): Observable<Page<T>>
	{
		return this.client.get<Page<T>>(`/api/${this.route}${this.ArgsAsQuery(args)}`)
			.pipe(map(x => Object.assign(new Page<T>(), x)));
	}

	create(item: T): Observable<T>
	{
		return this.client.post<T>(`/api/${this.route}`, item);
	}

	edit(item: T): Observable<T>
	{
		return this.client.put<T>(`/api/${this.route}`, item);
	}

	delete(item: T): Observable<T>
	{
		return this.client.delete<T>(`/api/${this.route}/${item.slug}`);
	}
}

@Injectable({
	providedIn: 'root'
})
export class LibraryService extends CrudApi<Library>
{
	constructor(client: HttpClient)
	{
		super(client, "libraries");
	}
}

@Injectable({
	providedIn: 'root'
})
export class LibraryItemService extends CrudApi<LibraryItem>
{
	constructor(client: HttpClient)
	{
		super(client, "items");
	}
}

@Injectable({
	providedIn: 'root'
})
export class SeasonService extends CrudApi<Season>
{
	constructor(client: HttpClient)
	{
		super(client, "seasons");
	}

	getForShow(show: string | number, args?: ApiArgs): Observable<Page<Season>>
	{
		return this.client.get(`/api/show/${show}/seasons${this.ArgsAsQuery(args)}`)
			.pipe(map(x => Object.assign(new Page<Season>(), x)));
	}
}

@Injectable({
	providedIn: 'root'
})
export class EpisodeService extends CrudApi<Episode>
{
	constructor(client: HttpClient)
	{
		super(client, "episodes");
	}

	getFromSeason(season: string | number, args?: ApiArgs): Observable<Page<Episode>>
	{
		return this.client.get(`/api/seasons/${season}/episodes${this.ArgsAsQuery(args)}`)
			.pipe(map(x => Object.assign(new Page<Episode>(), x)));
	}

	getFromSeasonNumber(show: string | number, seasonNumber: number, args?: ApiArgs): Observable<Page<Episode>>
	{
		return this.client.get(`/api/seasons/${show}-${seasonNumber}/episodes${this.ArgsAsQuery(args)}`)
			.pipe(map(x => Object.assign(new Page<Episode>(), x)));
	}
}
