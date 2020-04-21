import {AfterViewInit, Component, Input, OnInit} from '@angular/core';
import {Show} from "../../models/show";
import {DomSanitizer} from "@angular/platform-browser";

@Component({
	selector: 'app-show-grid',
	templateUrl: './show-grid.component.html',
	styleUrls: ['./show-grid.component.scss']
})
export class ShowGridComponent
{
	@Input() shows: Show[]
	
	constructor(private sanitizer: DomSanitizer) { }

	getThumb(slug: string)
	{
		return this.sanitizer.bypassSecurityTrustStyle("url(/poster/" + slug + ")");
	}
}
