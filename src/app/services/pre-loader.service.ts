import { HttpClient } from "@angular/common/http";
import { Injectable } from '@angular/core';
import { Page } from "../models/page";
import { Observable, of } from "rxjs"
import { map } from "rxjs/operators"

@Injectable({
	providedIn: 'root'
})
export class PreLoaderService
{
	private cache: [string, any[]][] = [];

	constructor(private http: HttpClient) { }

	load<T>(route: string): Observable<T[]>
	{
		let loaded = this.cache.find(x => x[0] == route);
		if (loaded != null)
			return of(loaded[1]);
		return this.http.get<Page<T>>(route).pipe(map(newData =>
		{
			this.cache.push([route, newData.items]);
			return newData.items;
		}));
	}
}
