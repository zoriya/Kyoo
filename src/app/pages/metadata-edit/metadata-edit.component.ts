import {Component, ElementRef, Inject, ViewChild} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {HttpClient} from "@angular/common/http";
import {Show} from "../../../models/resources/show";
import {Genre} from "../../../models/resources/genre";
import {MatChipInputEvent} from "@angular/material/chips";
import {MatAutocompleteSelectedEvent} from "@angular/material/autocomplete";
import {Observable, of} from "rxjs";
import {tap} from "rxjs/operators";
import {Studio} from "../../../models/resources/studio";
import {Provider} from "../../../models/provider";
import {MatSnackBar} from "@angular/material/snack-bar";
import {ShowGridComponent} from "../../components/show-grid/show-grid.component";

@Component({
	selector: 'app-metadata-edit',
	templateUrl: './metadata-edit.component.html',
	styleUrls: ['./metadata-edit.component.scss']
})
export class MetadataEditComponent
{
	@ViewChild("genreInput") private genreInput: ElementRef<HTMLInputElement>;
	public allGenres: Genre[];
	public allStudios: Studio[];
	
	@ViewChild("identifyGrid") private identifyGrid: ShowGridComponent;
	private identifying: Observable<Show[]>;
	private identifiedShows: [string, Show[]];
	public providers: Provider[];

	public metadataChanged: boolean = false;
	
	constructor(public dialogRef: MatDialogRef<MetadataEditComponent>, @Inject(MAT_DIALOG_DATA) public show: Show, private http: HttpClient, private snackBar: MatSnackBar) 
	{
		this.http.get<Genre[]>("/api/genres").subscribe(result => 
		{
			this.allGenres = result;	
		});
		this.http.get<Studio[]>("/api/studios").subscribe(result =>
		{
			this.allStudios = result;
		});
		this.http.get<Provider[]>("/api/providers").subscribe(result =>
		{
			this.providers = result;
		});

		this.reIdentify(this.show.title);
	}
	
	apply(): void
	{
		if (this.metadataChanged) 
		{
			this.http.post("/api/show/re-identify/" + this.show.slug, this.show.externalIDs).subscribe(
				(show: Show) => 
				{
					return;
				},
				() => 
				{
					this.snackBar.open("An unknown error occured.", null, { horizontalPosition: "left", panelClass: ['snackError'], duration: 2500 });
				}
			);
			this.dialogRef.close(this.show);
		}
		else
		{
			this.http.post("/api/show/edit/" + this.show.slug, this.show).subscribe(() =>
			{
				this.dialogRef.close(this.show);
			});
		}
	}
	
	addAlias(event: MatChipInputEvent)
	{
		const input = event.input;
		const value = event.value;

		this.show.aliases.push(value);
		if (input)
			input.value = "";
	}
	
	removeAlias(alias: string)
	{
		const i = this.show.aliases.indexOf(alias);
		this.show.aliases.splice(i, 1);
	}

	addGenre(event: MatChipInputEvent)
	{
		const input = event.input;
		const value = event.value;
		let genre: Genre = {id: 0, slug: null, name: value};
		
		this.show.genres.push(genre);
		if (input)
			input.value = "";
	}
	
	removeGenre(genre: Genre): void
	{
		const i = this.show.genres.indexOf(genre);
		this.show.genres.splice(i, 1);
	}

	autocompleteGenre(event: MatAutocompleteSelectedEvent): void 
	{
		this.show.genres.push(event.option.value);
		this.genreInput.nativeElement.value = '';
	}

	identityShow(name: string): Observable<Show[]>
	{
		if (this.identifiedShows && this.identifiedShows[0] === name)
			return of(this.identifiedShows[1]);
		this.identifying = this.http.get<Show[]>("/api/show/identify/" + name + "?isMovie=" + this.show.isMovie).pipe(
			tap(result => this.identifiedShows = [name, result])
		);
		return this.identifying;
	}
	
	reIdentify(search: string)
	{
		// this.identityShow(search).subscribe(x => this.identifyGrid.shows = x);
	}

	getMetadataID(provider: Provider)
	{
		return this.show.externalIDs.find(x => x.provider.name == provider.name);
	}
	
	setMetadataID(provider: Provider, id: string, link: string = undefined)
	{
		let i = this.show.externalIDs.findIndex(x => x.provider.name == provider.name);
		
		this.metadataChanged = true;
		if (i != -1)
		{
			this.show.externalIDs[i].dataID = id;
			this.show.externalIDs[i].link = link;
		}
		else
			this.show.externalIDs.push({provider: provider, dataID: id, link: link});
	}

	identifyID(show: Show)
	{
		for (let id of show.externalIDs)
			this.setMetadataID(id.provider, id.dataID, id.link);
	}
}
