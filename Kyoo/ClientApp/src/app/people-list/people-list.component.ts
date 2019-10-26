import { Component, Input, OnInit } from '@angular/core';
import { DomSanitizer } from "@angular/platform-browser";
import { People } from "../../models/people";

@Component({
	selector: 'app-people-list',
	templateUrl: './people-list.component.html',
	styleUrls: ['./people-list.component.scss']
})
export class PeopleListComponent implements OnInit
{
	@Input() people: People[];
	private peopleScroll: HTMLElement;

	constructor(private sanitizer: DomSanitizer) { }

	ngOnInit()
	{
		this.peopleScroll = document.getElementById("peopleScroll");
	}

	scrollLeft()
	{
		let scroll: number = this.peopleScroll.offsetWidth * 0.80;
		this.peopleScroll.scrollBy({ top: 0, left: -scroll, behavior: "smooth" });

		document.getElementById("pl-rightBtn").classList.remove("d-none");

		if (this.peopleScroll.scrollLeft - scroll <= 0)
			document.getElementById("pl-leftBtn").classList.add("d-none");
	}

	scrollRight()
	{
		let scroll: number = this.peopleScroll.offsetWidth * 0.80;
		this.peopleScroll.scrollBy({ top: 0, left: scroll, behavior: "smooth" });
		console.log(document.getElementById("pl-leftBtn"));
		document.getElementById("pl-leftBtn").classList.remove("d-none");

		if (this.peopleScroll.scrollLeft + scroll >= this.peopleScroll.scrollWidth - this.peopleScroll.clientWidth)
			document.getElementById("pl-rightBtn").classList.add("d-none");
	}

	getPeopleIcon(slug: string)
	{
		return this.sanitizer.bypassSecurityTrustStyle("url(/peopleimg/" + slug + ")");
	}
}
