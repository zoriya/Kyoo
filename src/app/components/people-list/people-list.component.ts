import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { MatButton } from "@angular/material/button";
import { DomSanitizer } from "@angular/platform-browser";
import { People } from "../../../models/people";
import {HorizontalScroller} from "../../misc/horizontal-scroller";
import {Page} from "../../../models/page";
import {HttpClient} from "@angular/common/http";

@Component({
	selector: 'app-people-list',
	templateUrl: './people-list.component.html',
	styleUrls: ['./people-list.component.scss']
})
export class PeopleListComponent extends HorizontalScroller
{
	@Input() people: Page<People>;

	constructor(private sanitizer: DomSanitizer, public client: HttpClient)
	{
		super();
	}

	getPeopleIcon(slug: string)
	{
		return this.sanitizer.bypassSecurityTrustStyle("url(/peopleimg/" + slug + ")");
	}
}
