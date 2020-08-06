import {Component, EventEmitter, Input, Output} from '@angular/core';
import {DomSanitizer} from "@angular/platform-browser";
import {Show} from "../../../models/resources/show";
import {Page} from "../../../models/page";

@Component({
	selector: 'app-shows-grid',
	templateUrl: './show-grid.component.html',
	styleUrls: ['./show-grid.component.scss']
})
export class ShowGridComponent
{
	@Input() shows: Page<Show>
	@Input() externalShows: boolean = false;
	@Output() clickCallback: EventEmitter<Show> = new EventEmitter();
	
	constructor(private sanitizer: DomSanitizer) { }

	getThumb(show: Show)
	{
		return this.sanitizer.bypassSecurityTrustStyle(`url(${show.poster})`);
	}
	
	getLink(show: Show)
	{
		if (this.externalShows)
			return null;
		return `/show/${show.slug}`;
	}
}
