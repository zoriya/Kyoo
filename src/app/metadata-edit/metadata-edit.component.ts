import {Component, ElementRef, Inject, OnInit, ViewChild} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {HttpClient} from "@angular/common/http";
import {Show} from "../../models/show";
import {Genre} from "../../models/genre";
import {MatChipInputEvent} from "@angular/material/chips";
import {MatAutocompleteSelectedEvent} from "@angular/material/autocomplete";
import {FormControl} from "@angular/forms";
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
		console.log("Removing a genre");
		console.log(genre);
		const i = this.show.genres.indexOf(genre);
		this.show.genres.splice(i, 1);
	}

	autocompleteGenre(event: MatAutocompleteSelectedEvent): void 
	{
		this.show.genres.push(event.option.value);
		this.genreInput.nativeElement.value = '';
	}
}
