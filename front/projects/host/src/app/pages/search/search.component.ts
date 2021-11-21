import { Component, OnInit, OnDestroy, AfterViewInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { SearchResult } from "../../models/search-result";
import { Title } from "@angular/platform-browser";
import { Page } from "../../models/page";

@Component({
	selector: "app-search",
	templateUrl: "./search.component.html",
	styleUrls: ["./search.component.scss"]
})
export class SearchComponent implements OnInit, OnDestroy, AfterViewInit
{
	items: SearchResult;

	constructor(private route: ActivatedRoute, private title: Title) { }

	ngOnInit(): void
	{
		this.route.data.subscribe((data) =>
		{
			this.items = data.items;
			this.title.setTitle(this.items.query + " - Kyoo");
		});
	}

	ngAfterViewInit(): void
	{
		const searchBar: HTMLInputElement = document.getElementById("search") as HTMLInputElement;
		searchBar.classList.add("searching");
		searchBar.value = this.items.query;
	}

	ngOnDestroy(): void
	{
		const searchBar: HTMLInputElement = document.getElementById("search") as HTMLInputElement;
		searchBar.classList.remove("searching");
		searchBar.value = "";
	}

	AsPage<T>(collection: T[]): Page<T>
	{
		return new Page<T>({this: "", items: collection, next: null, count: collection.length});
	}
}
