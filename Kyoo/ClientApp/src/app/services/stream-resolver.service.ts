import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, EMPTY } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Show } from "../../models/show";

import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable()
export class StreamResolverService implements Resolve<Show>
{
  constructor(private http: HttpClient, private snackBar: MatSnackBar) { }

  resolve(route: ActivatedRouteSnapshot): Show | Observable<Show> | Promise<Show>
  {
    let item: string = route.paramMap.get("item");
    return this.http.get<Show>("api/watch/" + item).pipe(catchError((error: HttpErrorResponse) =>
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
