import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
import { EMPTY, Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SearchResut } from "../../models/search-result";

@Injectable({
	providedIn: 'root'
})
export class SearchResolverService implements Resolve<SearchResut>
{
	constructor(private http: HttpClient, private snackBar: MatSnackBar) { }

	resolve(route: ActivatedRouteSnapshot): SearchResut | Observable<SearchResut> | Promise<SearchResut>
	{
		let query: string = route.paramMap.get("query");
		return this.http.get<SearchResut>("api/search/" + query).pipe(catchError((error: HttpErrorResponse) =>
		{
			console.log(error.status + " - " + error.message);
			this.snackBar.open("An unknow error occured.", null, { horizontalPosition: "left", panelClass: ['snackError'], duration: 2500 });
			return EMPTY;
		}));
	}
}
