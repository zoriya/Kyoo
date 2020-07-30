import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
import { EMPTY, Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Collection } from "../../../models/collection";
import { People } from "../../../models/people";

@Injectable({
	providedIn: 'root'
})
export class PeopleResolverService implements Resolve<Collection>
{
	constructor(private http: HttpClient, private snackBar: MatSnackBar) { }

	resolve(route: ActivatedRouteSnapshot): Collection | Observable<Collection> | Promise<Collection>
	{
		let people: string = route.paramMap.get("people-slug");
		return this.http.get<Collection>("api/people/" + people).pipe(catchError((error: HttpErrorResponse) =>
		{
			console.log(error.status + " - " + error.message);
			if (error.status == 404)
			{
				this.snackBar.open("People \"" + people + "\" not found.", null, { horizontalPosition: "left", panelClass: ['snackError'], duration: 2500 });
			}
			else
			{
				this.snackBar.open("An unknow error occured.", null, { horizontalPosition: "left", panelClass: ['snackError'], duration: 2500 });
			}
			return EMPTY;
		}));
	}
}
