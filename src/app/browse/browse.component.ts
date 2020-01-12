import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import { Show } from "../../models/show";

@Component({
  selector: 'app-browse',
  templateUrl: './browse.component.html',
  styleUrls: ['./browse.component.scss']
})
export class BrowseComponent
{
  @Input() shows: Show[];
  sortType: string = "title";
  sortUp: boolean = true;

  sortTypes: string[] = ["title", "release date"];

	constructor(private route: ActivatedRoute, private sanitizer: DomSanitizer)
	{
		this.route.data.subscribe((data) =>
		{
			this.shows = data.shows;
		});
	}

  getThumb(slug: string)
  {
    return this.sanitizer.bypassSecurityTrustStyle("url(/poster/" + slug + ")");
  }

  getLink(show: Show)
  {
    if (show.isCollection)
      return "/collection/" + show.slug;
    else
      return "/show/" + show.slug;
  }

  sort(type: string, order: boolean)
  {
    this.sortType = type;
    this.sortUp = order;

    if (type == this.sortTypes[0])
    {
      if (order)
        this.shows.sort((a, b) => { if (a.title < b.title) return -1; else if (a.title > b.title) return 1; return 0; });
      else
        this.shows.sort((a, b) => { if (a.title < b.title) return 1; else if (a.title > b.title) return -1; return 0; });
    }
    else if (type == this.sortTypes[1])
    {
      if (order)
        this.shows.sort((a, b) => a.startYear - b.startYear);
      else
        this.shows.sort((a, b) => b.startYear - a.startYear);
    }
  }
}
