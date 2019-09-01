import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import { Show } from "../../models/show";
import { Episode } from "../../models/episode";
import { HttpErrorResponse, HttpClient } from "@angular/common/http";
import { catchError } from "rxjs/operators";
import { MatSnackBar } from "@angular/material/snack-bar";

@Component({
  selector: 'app-show-details',
  templateUrl: './show-details.component.html',
  styleUrls: ['./show-details.component.scss']
})
export class ShowDetailsComponent implements OnInit
{
  show: Show;
  season;

  private toolbar: HTMLElement
  private backdrop: HTMLElement

  constructor(private route: ActivatedRoute, private sanitizer: DomSanitizer, private http: HttpClient, private snackBar: MatSnackBar)
  {
    this.route.queryParams.subscribe(params =>
    {
      this.season = params["season"];
    });
  }

  ngOnInit()
  {
    this.show = this.route.snapshot.data.show;

    if (this.season == null || this.show.seasons.find(x => x.seasonNumber == this.season) == null)
      this.season = this.show.seasons[0].seasonNumber;

    this.toolbar = document.getElementById("toolbar");
    this.backdrop = document.getElementById("backdrop");
    window.addEventListener("scroll", this.scroll, true);
    this.toolbar.setAttribute("style", `background-color: rgba(0, 0, 0, 0) !important`);

    this.getEpisodes();
  }

  ngOnDestroy()
  {
    window.removeEventListener("scroll", this.scroll, true);
  }

  scroll = () =>
  {
    let opacity: number = 2 * window.scrollY / this.backdrop.clientHeight;
    this.toolbar.setAttribute("style", `background-color: rgba(0, 0, 0, ${opacity}) !important`);
  }

  getEpisodes()
  {
    console.log("getting episodes");

    this.http.get<Episode[]>("api/episodes/" + this.show.slug + "/season/" + this.season).subscribe((episodes: Episode[]) =>
    {
      console.log(episodes.length);
    }, error =>
    {
      console.log(error.status + " - " + error.message);
      this.snackBar.open("An unknow error occured while getting episodes.", null, { horizontalPosition: "left", panelClass: ['snackError'], duration: 2500 });
    });

    console.log("Episodes got");
  }



  getPeopleIcon(slug: string)
  {
    return this.sanitizer.bypassSecurityTrustStyle("url(/peopleimg/" + slug + ")");
  }
}
