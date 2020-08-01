import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs"
import {Page} from "../../models/page";
import {IResource} from "../../models/resources/resource";
import {Library} from "../../models/library";
import {LibraryItem} from "../../models/library-item";
import {map} from "rxjs/operators";

class CrudApi<T extends IResource>
{
	constructor(private client: HttpClient, private route: string) {}

	get(id: number | string): Observable<T>
	{
		return this.client.get<T>(`/api/${this.route}/${id}`);
	}

	getAll(args: {sort: string} = null): Observable<Page<T>>
	{
		let params: string = "?";
		if (args && args.sort)
			params += "sortBy=" + args.sort;
		if (params == "?")
			params = "";
		return this.client.get<Page<T>>(`/api/${this.route}${params}`)
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
