import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
import { EMPTY, Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Show } from "../../../models/show";

@Injectable()
export class ShowResolverService implements Resolve<Show>
{
	constructor(private http: HttpClient, private snackBar: MatSnackBar) { }

	resolve(route: ActivatedRouteSnapshot): Show | Observable<Show> | Promise<Show>
	{
		let slug: string = route.paramMap.get("show-slug");
		return this.http.get<Show>("api/shows/" + slug).pipe(catchError((error: HttpErrorResponse) =>
		{
			console.log(error.status + " - " + error.message);
			if (error.status == 404)
				this.snackBar.open("Show \"" + slug + "\" not found.", null, { horizontalPosition: "left", panelClass: ['snackError'], duration: 2500 });
			else
				this.snackBar.open("An unknown error occured.", null, { horizontalPosition: "left", panelClass: ['snackError'], duration: 2500 });
			return EMPTY;
		}));
	}
}
