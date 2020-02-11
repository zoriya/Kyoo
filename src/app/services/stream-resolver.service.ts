import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
import { EMPTY, Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { WatchItem } from "../../models/watch-item";


@Injectable()
export class StreamResolverService implements Resolve<WatchItem>
{
	constructor(private http: HttpClient, private snackBar: MatSnackBar) { }

	resolve(route: ActivatedRouteSnapshot): WatchItem | Observable<WatchItem> | Promise<WatchItem>
	{
		let item: string = route.paramMap.get("item");
		return this.http.get<WatchItem>("api/watch/" + item).pipe(catchError((error: HttpErrorResponse) =>
		{
			console.log(error.status + " - " + error.message);
			if (error.status == 404)
			{
				this.snackBar.open("Episode \"" + item + "\" not found.", null, { horizontalPosition: "left", panelClass: ['snackError'], duration: 2500 });
			}
			else
			{
				this.snackBar.open("An unknow error occured.", null, { horizontalPosition: "left", panelClass: ['snackError'], duration: 2500 });
			}
			return EMPTY;
		}));
	}
}
