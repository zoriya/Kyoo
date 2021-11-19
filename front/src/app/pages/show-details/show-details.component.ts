import { AfterViewInit, Component, OnDestroy } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { DomSanitizer, SafeStyle, Title } from "@angular/platform-browser";
import { ActivatedRoute, Router } from "@angular/router";
import { Episode } from "../../models/resources/episode";
import { Show, ShowRole } from "../../models/resources/show";
import { MatDialog } from "@angular/material/dialog";
import { TrailerDialogComponent } from "../trailer-dialog/trailer-dialog.component";
import { MetadataEditComponent } from "../metadata-edit/metadata-edit.component";
import { Season } from "../../models/resources/season";
import { EpisodeService, PeopleService, SeasonService } from "../../services/api.service";
import { Page } from "../../models/page";
import { People } from "../../models/resources/people";
import { HttpClient } from "@angular/common/http";
import { LibraryItem } from "../../models/resources/library-item";
import { Collection } from "../../models/resources/collection";
import { ItemsUtils } from "../../misc/items-utils";

@Component({
	selector: "app-show-details",
	templateUrl: "./show-details.component.html",
	styleUrls: ["./show-details.component.scss"]
})
export class ShowDetailsComponent implements AfterViewInit, OnDestroy
{
	show: Show;
	seasons: Season[];
	season = 1;
	episodes: Page<Episode>[] = [];
	people: Page<People>;

	private scrollZone: HTMLElement;
	private toolbar: HTMLElement;
	private backdrop: HTMLElement;

	constructor(private route: ActivatedRoute,
	            private snackBar: MatSnackBar,
	            private sanitizer: DomSanitizer,
	            private title: Title,
	            private router: Router,
	            private dialog: MatDialog,
	            private http: HttpClient,
	            private seasonService: SeasonService,
	            private episodeService: EpisodeService,
	            private peopleService: PeopleService)
	{
		this.route.queryParams.subscribe(params =>
		{
			this.season = params.season ?? 1;
		});

		this.route.data.subscribe(data =>
		{
			this.show = data.show;
			this.title.setTitle(this.show.title + " - Kyoo");

			this.peopleService.getFromShow(this.show.slug).subscribe(x => this.people = x);

			if (this.show.isMovie)
				return;

			this.seasons = this.show.seasons;
			if (!this.seasons.find(y => y.seasonNumber === this.season))
			{
				this.season = 1;
				this.getEpisodes(1);
			}
			else
				this.getEpisodes(this.season);
		});
	}

	ngAfterViewInit(): void
	{
		this.scrollZone = document.getElementById("main");
		this.toolbar = document.getElementById("toolbar");
		this.backdrop = document.getElementById("backdrop");
		this.toolbar.setAttribute("style", `background-color: rgba(0, 0, 0, 0) !important`);
		this.scrollZone.style.marginTop = "0";
		this.scrollZone.style.maxHeight = "100vh";
		this.scrollZone.addEventListener("scroll", () => this.scroll());
	}

	ngOnDestroy(): void
	{
		this.title.setTitle("Kyoo");
		this.toolbar.setAttribute("style", `background-color: #000000 !important`);
		this.scrollZone.style.marginTop = null;
		this.scrollZone.style.maxHeight = null;
		this.scrollZone.removeEventListener("scroll", () => this.scroll());
	}

	scroll(): void
	{
		const opacity: number = 2 * this.scrollZone.scrollTop / this.backdrop.clientHeight;
		this.toolbar.setAttribute("style", `background-color: rgba(0, 0, 0, ${opacity}) !important`);
	}

	getThumb(item: Show): SafeStyle
	{
		return this.sanitizer.bypassSecurityTrustStyle(`url(${item.poster})`);
	}

	playClicked(): void
	{
		if (this.show.isMovie) {
			this.router.navigate(["/watch/" + this.show.slug]);
		}
		else {
			this.router.navigate(["/watch/" + this.show.slug + "-s1e1"]);
		}
	}

	getEpisodes(season: number): void
	{
		if (season < 0 || this.episodes[season])
			return;

		this.episodeService.getFromSeasonNumber(this.show.slug, this.season).subscribe(x =>
		{
			this.episodes[season] = x;
		});
		this.router.navigate([], {
			relativeTo: this.route,
			queryParams: {season},
			replaceUrl: true,
			queryParamsHandling: "merge",
		});
	}

	openTrailer(): void
	{
		this.dialog.open(TrailerDialogComponent, {
			width: "80%",
			height: "45vw",
			data: this.show.trailer,
			panelClass: "panel"
		});
	}

	editMetadata(): void
	{
		this.dialog.open(MetadataEditComponent, {width: "80%", data: this.show})
			.afterClosed().subscribe((result: Show) =>
		{
			if (result) {
				this.show = result;
			}
		});
	}

	redownloadImages(): void
	{
		this.http.put(`api/task/extract/show/${this.show.slug}/thumbnails`, undefined)
			.subscribe(() => { }, error =>
		{
			console.log(error.status + " - " + error.message);
			this.snackBar.open("An unknown error occurred while re-downloading images.", null, {
				horizontalPosition: "left",
				panelClass: ["snackError"],
				duration: 2500
			});
		});
	}

	extractSubs(): void
	{
		this.http.put(`api/task/extract/show/${this.show.slug}/subs`, undefined)
			.subscribe(() => { }, error =>
		{
			console.log(error.status + " - " + error.message);
			this.snackBar.open("An unknown error occurred while re-downloading images.", null, {
				horizontalPosition: "left",
				panelClass: ["snackError"],
				duration: 2500
			});
		});
	}

	getDate(item: LibraryItem | Show | ShowRole | Collection): string
	{
		return ItemsUtils.getDate(item);
	}
}
