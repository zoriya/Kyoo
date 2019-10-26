import { Component, OnInit, Input } from '@angular/core';
import { DomSanitizer } from "@angular/platform-browser";
import { Show } from "../../models/show";

@Component({
	selector: 'app-shows-list',
	templateUrl: './shows-list.component.html',
	styleUrls: ['./shows-list.component.scss']
})
export class ShowsListComponent implements OnInit
{
	@Input() shows: Show[];
	private showsScroll: HTMLElement;

	constructor(private sanitizer: DomSanitizer) { }

	ngOnInit()
	{
		this.showsScroll = document.getElementById("showsScroll");
	}

	scrollLeft()
	{
		let scroll: number = this.showsScroll.offsetWidth * 0.80;
		this.showsScroll.scrollBy({ top: 0, left: -scroll, behavior: "smooth" });

		document.getElementById("pl-rightBtn").classList.remove("d-none");

		if (this.showsScroll.scrollLeft - scroll <= 0)
			document.getElementById("pl-leftBtn").classList.add("d-none");
	}

	scrollRight()
	{
		let scroll: number = this.showsScroll.offsetWidth * 0.80;
		this.showsScroll.scrollBy({ top: 0, left: scroll, behavior: "smooth" });
		document.getElementById("pl-leftBtn").classList.remove("d-none");

		if (this.showsScroll.scrollLeft + scroll >= this.showsScroll.scrollWidth - this.showsScroll.clientWidth)
			document.getElementById("pl-rightBtn").classList.add("d-none");
	}

	getThumb(slug: string)
	{
		return this.sanitizer.bypassSecurityTrustStyle("url(/poster/" + slug + ")");
	}
}
