import { Component, OnInit } from '@angular/core';
import { Collection } from "../../models/collection";
import { ActivatedRoute } from "@angular/router";
import { DomSanitizer } from "@angular/platform-browser";

@Component({
  selector: 'app-collection',
  templateUrl: './collection.component.html',
  styleUrls: ['./collection.component.scss']
})
export class CollectionComponent implements OnInit
{
  collection: Collection;

	constructor(private route: ActivatedRoute, private sanitizer: DomSanitizer) { }

  ngOnInit()
  {
    this.collection = this.route.snapshot.data.collection;
  }

	getThumb()
	{
		return this.sanitizer.bypassSecurityTrustStyle("url(" + this.collection.poster + ")");
	}
}
