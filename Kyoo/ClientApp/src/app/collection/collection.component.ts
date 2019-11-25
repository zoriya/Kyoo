import { Component, OnInit } from '@angular/core';
import { Collection } from "../../models/collection";
import { ActivatedRoute } from "@angular/router";
import { DomSanitizer } from "@angular/platform-browser";

@Component({
  selector: 'app-collection',
  templateUrl: './collection.component.html',
  styleUrls: ['./collection.component.scss']
})
export class CollectionComponent
{
  collection: Collection;

	constructor(private route: ActivatedRoute, private sanitizer: DomSanitizer)
	{
		this.route.data.subscribe((data) =>
		{
			this.collection = data.collection;
		});
	}

	getThumb()
	{
		return this.sanitizer.bypassSecurityTrustStyle("url(" + this.collection.poster + ")");
	}
}
