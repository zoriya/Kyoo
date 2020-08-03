import {Component} from '@angular/core';
import {Collection} from "../../../models/collection";
import {ActivatedRoute} from "@angular/router";
import {DomSanitizer} from "@angular/platform-browser";
import {Show} from "../../../models/show";
import {Page} from "../../../models/page";
import {ShowService} from "../../services/api.service";

@Component({
	selector: 'app-collection',
	templateUrl: './collection.component.html',
	styleUrls: ['./collection.component.scss']
})
export class CollectionComponent
{
	collection: Collection;
	shows: Page<Show>;

	constructor(private route: ActivatedRoute, private sanitizer: DomSanitizer, private showService: ShowService)
	{
		this.route.data.subscribe((data) =>
		{
			this.collection = data.collection;
			this.showService.getForCollection(this.collection.slug).subscribe(x => this.shows = x);
		});
	}

	getThumb()
	{
		return this.sanitizer.bypassSecurityTrustStyle("url(" + this.collection.poster + ")");
	}
}
