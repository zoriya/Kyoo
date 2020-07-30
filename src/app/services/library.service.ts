import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs"
import {Page} from "../../models/page";
import {IResource} from "../../models/resources/resource";

class CrudApi<T extends IResource>
{
  constructor(private client: HttpClient, private route: string) {}

  get(id: number | string): Observable<T>
  {
    return this.client.get<T>(`/api/${this.route}/${id}`);
  }

  getAll(id: number | string): Observable<Page<T>>
  {
    return this.client.get<Page<T>>(`/api/${this.route}`);
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
export class LibraryService
{
	constructor() { }

	get()
	{

	}
}
