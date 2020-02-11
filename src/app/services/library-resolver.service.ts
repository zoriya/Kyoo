import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
import { EMPTY, Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Show } from "../../models/show";


@Injectable()
export class LibraryResolverService implements Resolve<Show[]>
{
	constructor(private http: HttpClient, private snackBar: MatSnackBar) { }

	resolve(route: ActivatedRouteSnapshot): Show[] | Observable<Show[]> | Promise<Show[]>
	{
		let slug: string = route.paramMap.get("library-slug");

		if (slug == null)
		{
			return this.http.get<Show[]>("api/shows").pipe(catchError((error: HttpErrorResponse) =>
			{
				console.log(error.status + " - " + error.message);
				this.snackBar.open("An unknow error occured.", null, { horizontalPosition: "left", panelClass: ['snackError'], duration: 2500 });
				return EMPTY;
			}));
		}
		else
		{
			return this.http.get<Show[]>("api/libraries/" + slug).pipe(catchError((error: HttpErrorResponse) =>
			{
				console.log(error.status + " - " + error.message);
				if (error.status == 404)
				{
					this.snackBar.open("Library \"" + slug + "\" not found.", null, { horizontalPosition: "left", panelClass: ['snackError'], duration: 2500 });
				}
				else
				{
					this.snackBar.open("An unknow error occured.", null, { horizontalPosition: "left", panelClass: ['snackError'], duration: 2500 });
				}
				return EMPTY;
			}));
		}
	}
}
