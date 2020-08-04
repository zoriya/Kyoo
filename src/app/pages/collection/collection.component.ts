import {Component} from '@angular/core';
import {Collection} from "../../../models/collection";
import {ActivatedRoute} from "@angular/router";
import {DomSanitizer} from "@angular/platform-browser";
import {Show} from "../../../models/show";
import {Page} from "../../../models/page";
import {People} from "../../../models/people";

@Component({
	selector: 'app-collection',
	templateUrl: './collection.component.html',
	styleUrls: ['./collection.component.scss']
})
export class CollectionComponent
{
	collection: Collection | People;
	shows: Page<Show>;

	constructor(private route: ActivatedRoute, private sanitizer: DomSanitizer)
	{
		this.route.data.subscribe((data) =>
		{
			this.collection = data.collection;
			this.shows = data.shows;
		});
	}

	getThumb()
	{
		return this.sanitizer.bypassSecurityTrustStyle("url(" + this.collection.poster + ")");
	}
}
