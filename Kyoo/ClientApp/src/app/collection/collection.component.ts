import { Component, OnInit } from '@angular/core';
import { Collection } from "../../models/collection";
import { ActivatedRoute } from "@angular/router";

@Component({
  selector: 'app-collection',
  templateUrl: './collection.component.html',
  styleUrls: ['./collection.component.scss']
})
export class CollectionComponent implements OnInit
{
  collection: Collection;

  constructor(private route: ActivatedRoute) { }

  ngOnInit()
  {
    this.collection = this.route.snapshot.data.collection;
  }

}
