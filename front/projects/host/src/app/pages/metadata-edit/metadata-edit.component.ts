import { Component, Inject, OnInit, ViewChild } from "@angular/core";
import { FormControl } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { HttpClient } from "@angular/common/http";
import { Page } from "../../models/page";
import { Show } from "../../models/resources/show";
import { Genre } from "../../models/resources/genre";
import { MatChipInputEvent } from "@angular/material/chips";
import { MatAutocompleteSelectedEvent } from "@angular/material/autocomplete";
import { Observable, of } from "rxjs";
import { catchError, filter, map, mergeAll, tap } from "rxjs/operators";
import { Studio } from "../../models/resources/studio";
import { Provider } from "../../models/provider";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ShowGridComponent } from "../../components/show-grid/show-grid.component";
import { GenreService, ShowService, StudioService } from "../../services/api.service";
import { ExternalID } from "../../models/external-id";

@Component({
	selector: "app-metadata-edit",
	templateUrl: "./metadata-edit.component.html",
	styleUrls: ["./metadata-edit.component.scss"]
})
export class MetadataEditComponent implements OnInit
{
	studioForm: FormControl = new FormControl();
	filteredStudios: Observable<Studio[]>;

	genreForm: FormControl = new FormControl();
	filteredGenres: Observable<Genre[]>;

	@ViewChild("identifyGrid") private identifyGrid: ShowGridComponent;
	private _identifying: Observable<Show[]>;
	private _identifiedShows: [string, Show[]];
	public providers: Provider[] = [];

	public metadataChanged: boolean = false;

	constructor(public dialogRef: MatDialogRef<MetadataEditComponent>,
	            @Inject(MAT_DIALOG_DATA) public show: Show,
	            private http: HttpClient,
	            private showsApi: ShowService,
	            private studioApi: StudioService,
	            private genreApi: GenreService,
	            private snackBar: MatSnackBar)
	{
		this.http.get<Page<Provider>>("/api/providers").subscribe(result =>
		{
			this.providers = result.items;
		});

		this.reIdentify(this.show.title);
	}

	ngOnInit(): void
	{
		this.filteredGenres = this.genreForm.valueChanges
			.pipe(
				filter(x => x),
				map(x => typeof x === "string" ? x : x.name),
				map(x => this.genreApi.search(x)),
				mergeAll(),
				catchError(x =>
				{
					console.log(x);
					return [];
				})
			);

		this.filteredStudios = this.studioForm.valueChanges
			.pipe(
				filter(x => x),
				map(x => typeof x === "string" ? x : x.name),
				map(x => this.studioApi.search(x)),
				mergeAll(),
				catchError(x =>
				{
					console.log(x);
					return [];
				})
			);
	}

	apply(): void
	{
		if (this.metadataChanged)
		{
			this.http.post("/api/show/re-identify/" + this.show.slug, this.show.externalIDs).subscribe(
				() => {},
				() =>
				{
					this.snackBar.open("An unknown error occurred.", null, {
						horizontalPosition: "left",
						panelClass: ["snackError"],
						duration: 2500
					});
				}
			);
			this.dialogRef.close(this.show);
		}
		else
		{
			this.showsApi.edit(this.show).subscribe(() =>
			{
				this.dialogRef.close(this.show);
			});
		}
	}

	addAlias(event: MatChipInputEvent): void
	{
		const input: HTMLInputElement = event.input;
		const value: string = event.value;

		this.show.aliases.push(value);
		if (input)
			input.value = "";
	}

	removeAlias(alias: string): void
	{
		const i: number = this.show.aliases.indexOf(alias);
		this.show.aliases.splice(i, 1);
	}

	addGenre(event: MatChipInputEvent): void
	{
		const input: HTMLInputElement = event.input;
		const value: string = event.value;
		const genre: Genre = {id: 0, slug: null, name: value};

		this.show.genres.push(genre);
		if (input)
			input.value = "";
	}

	removeGenre(genre: Genre): void
	{
		const i: number = this.show.genres.indexOf(genre);
		this.show.genres.splice(i, 1);
	}

	autocompleteGenre(event: MatAutocompleteSelectedEvent): void
	{
		this.show.genres.push(event.option.value);
	}

	identityShow(name: string): Observable<Show[]>
	{
		if (this._identifiedShows && this._identifiedShows[0] === name)
			return of(this._identifiedShows[1]);
		this._identifying = this.http.get<Show[]>("/api/show/identify/" + name + "?isMovie=" + this.show.isMovie).pipe(
			tap(result => this._identifiedShows = [name, result])
		);
		return this._identifying;
	}

	reIdentify(search: string): void
	{
		// TODO implement this
		// this.identityShow(search).subscribe(x => this.identifyGrid.shows = x);
	}

	getMetadataID(provider: Provider): ExternalID
	{
		return this.show.externalIDs.find(x => x.provider.name === provider.name);
	}

	setMetadataID(provider: Provider, id: string, link: string = null): void
	{
		const i: number = this.show.externalIDs.findIndex(x => x.provider.name === provider.name);

		this.metadataChanged = true;
		if (i !== -1)
		{
			this.show.externalIDs[i].dataID = id;
			this.show.externalIDs[i].link = link;
		}
		else
			this.show.externalIDs.push({provider, dataID: id, link});
	}

	identifyID(show: Show): void
	{
		for (const id of show.externalIDs)
			this.setMetadataID(id.provider, id.dataID, id.link);
	}
}
