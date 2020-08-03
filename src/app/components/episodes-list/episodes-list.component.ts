import { Component, Input} from '@angular/core';
import { DomSanitizer } from "@angular/platform-browser";
import { Episode } from "../../../models/episode";
import {HorizontalScroller} from "../../misc/horizontal-scroller";
import {Page} from "../../../models/page";
import {HttpClient} from "@angular/common/http";

@Component({
	selector: 'app-episodes-list',
	templateUrl: './episodes-list.component.html',
	styleUrls: ['./episodes-list.component.scss']
})
export class EpisodesListComponent extends HorizontalScroller
{
	@Input() displayShowTitle: boolean = false;
	@Input() episodes: Page<Episode>;

	constructor(private sanitizer: DomSanitizer, public client: HttpClient)
	{
		super();
	}

	sanitize(url: string)
	{
		return this.sanitizer.bypassSecurityTrustStyle("url(" + url + ")");
	}
}
