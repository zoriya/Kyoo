import { HttpClient } from "@angular/common/http";
import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from "@angular/material/snack-bar";
import { Title } from '@angular/platform-browser';
import {ActivatedRoute, Router} from '@angular/router';
import { Episode } from "../../models/episode";
import { Show } from "../../models/show";

@Component({
	selector: 'app-show-details',
	templateUrl: './show-details.component.html',
	styleUrls: ['./show-details.component.scss']
})
export class ShowDetailsComponent implements OnInit
{
	show: Show;
	episodes: Episode[] = null;
	season: number;

	private toolbar: HTMLElement;
	private backdrop: HTMLElement;

	constructor(private route: ActivatedRoute, private http: HttpClient, private snackBar: MatSnackBar, private title: Title, private router: Router)
	{
		this.route.queryParams.subscribe(params =>
		{
			this.season = params["season"];
		});

		this.route.data.subscribe(data =>
		{
			this.show = data.show;
			this.title.setTitle(this.show.title + " - Kyoo");

			if (this.season == undefined || this.show.seasons == undefined || this.show.seasons.find(x => x.seasonNumber == this.season) == null)
				this.season = 1;

			this.getEpisodes();
		});
	}

	ngOnInit()
	{
		this.toolbar = document.getElementById("toolbar");
		this.backdrop = document.getElementById("backdrop");
		window.addEventListener("scroll", this.scroll, true);
		this.toolbar.setAttribute("style", `background-color: rgba(0, 0, 0, 0) !important`);
	}

	ngOnDestroy()
	{
		window.removeEventListener("scroll", this.scroll, true);
		this.title.setTitle("Kyoo");
		this.toolbar.setAttribute("style", `background-color: #000000 !important`);
	}

	scroll = () =>
	{
		let opacity: number = 2 * window.scrollY / this.backdrop.clientHeight;
		this.toolbar.setAttribute("style", `background-color: rgba(0, 0, 0, ${opacity}) !important`);
	};

	playClicked()
	{
		if (this.show.isMovie)
			this.router.navigate(["/watch/" + this.show.slug]);
		else
			this.router.navigate(["/watch/" + this.show.slug + "-s1e1"]);
	}

	getEpisodes()
	{
		if (this.show == undefined || this.show.seasons == undefined)
			return;

		if (this.show.seasons.find(x => x.seasonNumber == this.season).episodes != null)
			this.episodes = this.show.seasons.find(x => x.seasonNumber == this.season).episodes;


		this.http.get<Episode[]>("api/episodes/" + this.show.slug + "/season/" + this.season).subscribe((episodes: Episode[]) =>
		{
			this.show.seasons.find(x => x.seasonNumber == this.season).episodes = episodes;
			this.episodes = episodes;
		}, error =>
		{
			console.log(error.status + " - " + error.message);
			this.snackBar.open("An unknow error occured while getting episodes.", null, { horizontalPosition: "left", panelClass: ['snackError'], duration: 2500 });
		});
	}
}
