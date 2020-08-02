import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {MatSnackBar} from '@angular/material/snack-bar';
import {ActivatedRouteSnapshot, Resolve} from '@angular/router';
import {Observable, EMPTY} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {IResource} from "../../../models/resources/resource";

@Injectable()
export class ItemResolver
{
	public static resolvers: any[] = [];

	static forResource<T extends IResource>(resource: string)
	{
		@Injectable()
		class Resolver implements Resolve<T>
		{
			constructor(private http: HttpClient,
			            private snackBar: MatSnackBar)
			{ }

			resolve(route: ActivatedRouteSnapshot): T | Observable<T> | Promise<T>
			{
				let res: string = resource.replace(/:(.*?)(\/|$)/, (x, y) => `${route.paramMap.get(y)}/`);

				return this.http.get<T>(`api/${res}`)
					.pipe(
						catchError((error: HttpErrorResponse) =>
						{
							console.log(error.status + " - " + error.message);
							this.snackBar.open(`An unknown error occurred: ${error.message}.`, null, {
								horizontalPosition: "left",
								panelClass: ['snackError'],
								duration: 2500
							});
							return EMPTY;
						}));
			}
		}
		ItemResolver.resolvers.push(Resolver);
		return Resolver;
	}
}
