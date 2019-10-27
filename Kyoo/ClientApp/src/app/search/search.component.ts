import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from "@angular/router";
import { SearchResut } from "../../models/search-result";
import { Title } from "@angular/platform-browser";

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit
{
	items: SearchResut;

	constructor(private route: ActivatedRoute, private title: Title) { }

	ngOnInit()
	{
		this.route.data.subscribe((data) =>
		{
			this.items = data.items;
			this.title.setTitle(this.items.query + " - Kyoo");
		});
	}
}
