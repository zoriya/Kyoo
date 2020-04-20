import {Component, ElementRef, Inject, OnInit, ViewChild} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {HttpClient} from "@angular/common/http";
import {Show} from "../../models/show";
import {Genre} from "../../models/genre";
import {MatChipInputEvent} from "@angular/material/chips";
import {MatAutocompleteSelectedEvent} from "@angular/material/autocomplete";
import {Observable, of} from "rxjs";
import {tap} from "rxjs/operators";
import {Studio} from "../../models/studio";

@Component({
	selector: 'app-metadata-edit',
	templateUrl: './metadata-edit.component.html',
	styleUrls: ['./metadata-edit.component.scss']
})
export class MetadataEditComponent implements OnInit
{
	@ViewChild("genreInput") genreInput: ElementRef<HTMLInputElement>;
	
	private allGenres: Genre[];
	private allStudios: Studio[];
	
	private identifing: Observable<Show[]>;
	private identifiedShows: [string, Show[]];
	
	constructor(public dialogRef: MatDialogRef<MetadataEditComponent>, @Inject(MAT_DIALOG_DATA) public show: Show, private http: HttpClient) 
	{
		this.http.get<Genre[]>("/api/genres").subscribe(result => 
		{
			this.allGenres = result;	
		});
		this.http.get<Studio[]>("/api/studios").subscribe(result =>
		{
			this.allStudios = result;
		});
	}

	ngOnInit(): void 
	{
	}
	
	apply(): void
	{
		this.http.post("/api/show/edit/" + this.show.slug, this.show).subscribe(() => 
		{
			this.dialogRef.close(this.show);	
		});
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
		let genre: Genre = {slug: null, name: value};
		
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
		if (this.identifing)
			return this.identifing;
		if (this.identifiedShows && this.identifiedShows[0] === name)
			return of(this.identifiedShows[1]);
		this.identifing = this.http.get<Show[]>("/api/show/identify/" + name + "?isMovie=" + this.show.isMovie).pipe(
			tap(result => this.identifiedShows = [name, result])
		);
		return this.identifing;
	}
}
