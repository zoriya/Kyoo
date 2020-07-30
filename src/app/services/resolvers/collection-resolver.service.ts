import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
import { EMPTY, Observable } from 'rxjs';
import { catchError } from 'rxjs/operators'
import { Collection } from "../../../models/collection";

@Injectable({
	providedIn: 'root'
})
export class CollectionResolverService implements Resolve<Collection>
{
	constructor(private http: HttpClient, private snackBar: MatSnackBar) { }

	resolve(route: ActivatedRouteSnapshot): Collection | Observable<Collection> | Promise<Collection>
	{
		let collection: string = route.paramMap.get("collection-slug");
		return this.http.get<Collection>("api/collection/" + collection).pipe(catchError((error: HttpErrorResponse) =>
		{
			console.log(error.status + " - " + error.message);
			if (error.status == 404)
			{
				this.snackBar.open("Collection \"" + collection + "\" not found.", null, { horizontalPosition: "left", panelClass: ['snackError'], duration: 2500 });
			}
			else
			{
				this.snackBar.open("An unknow error occured.", null, { horizontalPosition: "left", panelClass: ['snackError'], duration: 2500 });
			}
			return EMPTY;
		}));
	}
}
