import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from "@angular/material/snack-bar";
import { Title } from '@angular/platform-browser';
import {ActivatedRoute, Router} from '@angular/router';
import { Episode } from "../../../models/episode";
import { Show } from "../../../models/show";
import {MatDialog} from "@angular/material/dialog";
import {TrailerDialogComponent} from "../trailer-dialog/trailer-dialog.component";
import {MetadataEditComponent} from "../metadata-edit/metadata-edit.component";
import {Season} from "../../../models/season";
import {EpisodeService, PeopleService, SeasonService} from "../../services/api.service";
import {Page} from "../../../models/page";
import {People} from "../../../models/people";

@Component({
	selector: 'app-show-details',
	templateUrl: './show-details.component.html',
	styleUrls: ['./show-details.component.scss']
})
export class ShowDetailsComponent implements OnInit
{
	show: Show;
	seasons: Season[];
	season: number = 1;
	episodes: Page<Episode>[] = [];
	people: Page<People>;

	private toolbar: HTMLElement;
	private backdrop: HTMLElement;

	constructor(private route: ActivatedRoute,
	            private snackBar: MatSnackBar,
	            private title: Title,
	            private router: Router,
	            private dialog: MatDialog,
	            private seasonService: SeasonService,
	            private episodeService: EpisodeService,
	            private peopleService: PeopleService)
	{
		this.route.queryParams.subscribe(params =>
		{
			this.season = params["season"] ?? 1;
		});

		this.route.data.subscribe(data =>
		{
			this.show = data.show;
			this.title.setTitle(this.show.title + " - Kyoo");

			if (this.show.isMovie)
				return;

			this.seasonService.getForShow(this.show.slug, {limit: 0}).subscribe(x =>
			{
				this.seasons = x.items;
				if (x.items.find(x => x.seasonNumber == this.season) == null)
				{
					this.season = 1;
					this.getEpisodes(1);
				}
			});
			this.getEpisodes(this.season);
			this.peopleService.getFromShow(this.show.slug).subscribe(x => this.people = x);
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

	getEpisodes(season: number)
	{
		if (season < 0)
			return;

		if (this.episodes[season] != undefined)
			return;

		this.episodeService.getFromSeasonNumber(this.show.slug, this.season).subscribe(x =>
		{
			this.episodes[season] = x;
		});
	}

	openTrailer()
	{
		this.dialog.open(TrailerDialogComponent, {width: "80%", height: "45vw", data: this.show.trailerUrl, panelClass: "panel"});
	}
	
	editMetadata()
	{
		this.dialog.open(MetadataEditComponent, {width: "80%", data: this.show}).afterClosed().subscribe((result: Show) =>
		{
			if (result)
				this.show = result;
		});
	}

	redownloadImages()
	{
	// 	this.http.post("api/show/download-images/" + this.show.slug, undefined).subscribe(() => { }, error =>
	// 	{
	// 		console.log(error.status + " - " + error.message);
	// 		this.snackBar.open("An unknown error occured while re-downloading images.", null, { horizontalPosition: "left", panelClass: ['snackError'], duration: 2500 });
	// 	});
	}
}
