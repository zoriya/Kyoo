import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from "@angular/router";
import { SearchResut } from "../../models/search-result";

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit
{
	items: SearchResut;

	constructor(private route: ActivatedRoute) { }

	ngOnInit()
	{
		this.route.data.subscribe((data) =>
		{
			this.items = data.items;
		});
	}
}
