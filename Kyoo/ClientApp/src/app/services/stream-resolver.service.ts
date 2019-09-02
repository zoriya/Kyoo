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
    let slug: string = route.paramMap.get("show-slug");
    let season: number = parseInt(route.paramMap.get("season-number"));
    let episode: number = parseInt(route.paramMap.get("episode-number"));
    return this.http.get<Show>("api/watch/" + slug + "/s" + season + "/e" + episode).pipe(catchError((error: HttpErrorResponse) =>
    {
      console.log(error.status + " - " + error.message);
      if (error.status == 404)
      {
        this.snackBar.open("Can't find this episode \"" + slug + "S" + season + ":E" + episode + "\" not found.", null, { horizontalPosition: "left", panelClass: ['snackError'], duration: 2500 });
      }
      else
      {
        this.snackBar.open("An unknow error occured.", null, { horizontalPosition: "left", panelClass: ['snackError'], duration: 2500 });
      }
      return EMPTY;
    }));
  }
}
